import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { randomUUID } from "node:crypto";
import {
  achievements,
  childAchievements,
  childProfiles,
  InsertUser,
  learningSessions,
  lessons,
  parentProfiles,
  questionAttempts,
  questionSessions,
  questionTemplates,
  questProgress,
  quests,
  rewardTransactions,
  skillProgress,
  skills,
  users,
  worldProgress,
  worlds,
} from "../drizzle/schema";
import { skillByKey, starterAchievements, starterLessons, starterQuest, starterQuestionTemplates, starterSkills, starterWorlds } from "../shared/learningContent";
import { masteryFrom, rewardForAttempt } from "./learningEngine";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

const requireDb = async () => {
  const db = await getDb();
  if (!db) throw new Error("service.databaseUnavailable");
  return db;
};

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  (["name", "email", "loginMethod"] as const).forEach(field => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function seedStarterContent() {
  const db = await requireDb();
  const existing = await db.select({ key: worlds.key }).from(worlds).limit(1);
  if (existing.length) return;
  await db.insert(worlds).values(starterWorlds.map(world => ({ ...world, isPublished: true })));
  await db.insert(skills).values(starterSkills.map(skill => ({ ...skill, isPublished: true })));
  await db.insert(lessons).values(starterLessons);
  await db.insert(questionTemplates).values(starterQuestionTemplates.map(template => ({ ...template, isEnabled: true })));
  await db.insert(quests).values(starterQuest);
  await db.insert(achievements).values(starterAchievements);
}

async function getOrCreateParentProfile(userId: number) {
  const db = await requireDb();
  const existing = await db.select().from(parentProfiles).where(eq(parentProfiles.userId, userId)).limit(1);
  if (existing[0]) return existing[0];
  const profile = { id: randomUUID(), userId };
  await db.insert(parentProfiles).values(profile);
  const created = await db.select().from(parentProfiles).where(eq(parentProfiles.id, profile.id)).limit(1);
  return created[0]!;
}

async function assertOwnedChild(userId: number, childId: string) {
  const db = await requireDb();
  const parent = await getOrCreateParentProfile(userId);
  const child = await db.select().from(childProfiles).where(and(eq(childProfiles.id, childId), eq(childProfiles.parentId, parent.id))).limit(1);
  if (!child[0]) throw new Error("access.childNotFound");
  return child[0];
}

export async function listChildren(userId: number) {
  const db = await requireDb();
  const parent = await getOrCreateParentProfile(userId);
  return db.select().from(childProfiles).where(eq(childProfiles.parentId, parent.id));
}

export async function createChild(userId: number, input: { displayName: string; age: number; grade: string; avatarKey: string; locale: "en" | "ar" }) {
  const db = await requireDb();
  await seedStarterContent();
  const parent = await getOrCreateParentProfile(userId);
  const child = { id: randomUUID(), parentId: parent.id, ...input };
  await db.insert(childProfiles).values(child);
  await db.insert(worldProgress).values(starterWorlds.map(world => ({
    id: randomUUID(), childId: child.id, worldKey: world.key, isUnlocked: world.order === 1, stars: 0,
  })));
  const rows = await db.select().from(childProfiles).where(eq(childProfiles.id, child.id)).limit(1);
  return rows[0]!;
}

export async function updateChild(userId: number, childId: string, input: { displayName?: string; age?: number; grade?: string; avatarKey?: string; locale?: "en" | "ar" }) {
  const db = await requireDb();
  await assertOwnedChild(userId, childId);
  await db.update(childProfiles).set(input).where(eq(childProfiles.id, childId));
  const child = await db.select().from(childProfiles).where(eq(childProfiles.id, childId)).limit(1);
  return child[0]!;
}

export async function createLearningSession(userId: number, input: { childId: string; skillKey: string; mode: "lesson" | "battle" }) {
  const db = await requireDb();
  await assertOwnedChild(userId, input.childId);
  const session = { id: randomUUID(), ...input };
  await db.insert(learningSessions).values(session);
  return session;
}

export async function completeLearningSession(userId: number, input: { childId: string; sessionId: string; durationSeconds: number }) {
  const db = await requireDb();
  await assertOwnedChild(userId, input.childId);
  const existing = await db.select().from(learningSessions).where(and(eq(learningSessions.id, input.sessionId), eq(learningSessions.childId, input.childId))).limit(1);
  if (!existing[0]) throw new Error("learning.error.sessionNotFound");
  const durationSeconds = Math.min(15 * 60, Math.max(1, input.durationSeconds));
  if (!existing[0].completedAt) {
    await db.update(learningSessions).set({ completedAt: new Date(), durationSeconds }).where(eq(learningSessions.id, input.sessionId));
  }
  return { success: true } as const;
}

export async function createQuestionSession(userId: number, childId: string, skillKey: string, questionData: unknown, correctAnswer: string, sessionId?: string) {
  const db = await requireDb();
  await assertOwnedChild(userId, childId);
  const id = sessionId ?? randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await db.insert(questionSessions).values({ id, childId, skillKey, questionData, correctAnswer, expiresAt });
  return { id, expiresAt };
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function calculateStreak(lastPracticeAt: Date | null, currentStreak: number, now: Date) {
  if (!lastPracticeAt) return 1;
  const today = dayKey(now);
  const last = dayKey(lastPracticeAt);
  if (today === last) return currentStreak;
  const yesterday = dayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  return last === yesterday ? currentStreak + 1 : 1;
}

export async function recordAnswer(userId: number, input: { childId: string; questionSessionId: string; answer: string; responseTimeMs: number; usedHint: boolean }) {
  const db = await requireDb();
  const child = await assertOwnedChild(userId, input.childId);
  const session = await db.select().from(questionSessions).where(and(eq(questionSessions.id, input.questionSessionId), eq(questionSessions.childId, child.id))).limit(1);
  const question = session[0];
  if (!question || question.expiresAt < new Date()) throw new Error("learning.error.questionExpired");
  const isCorrect = question.correctAnswer === input.answer;
  const now = new Date();
  const rewards = rewardForAttempt(isCorrect, input.responseTimeMs);
  const progressRows = await db.select().from(skillProgress).where(and(eq(skillProgress.childId, child.id), eq(skillProgress.skillKey, question.skillKey))).limit(1);
  const existing = progressRows[0];
  const attempts = (existing?.attempts ?? 0) + 1;
  const correctAnswers = (existing?.correctAnswers ?? 0) + (isCorrect ? 1 : 0);
  const mastery = masteryFrom(attempts, correctAnswers, input.responseTimeMs);
  const progressId = existing?.id ?? randomUUID();
  await db.insert(skillProgress).values({ id: progressId, childId: child.id, skillKey: question.skillKey, attempts, correctAnswers, mastery, lastPracticedAt: now })
    .onDuplicateKeyUpdate({ set: { attempts, correctAnswers, mastery, lastPracticedAt: now } });
  await db.insert(questionAttempts).values({
    id: randomUUID(), childId: child.id, sessionId: question.id, skillKey: question.skillKey, submittedAnswer: input.answer,
    isCorrect, responseTimeMs: input.responseTimeMs, usedHint: input.usedHint,
  });
  const nextStreak = calculateStreak(child.lastPracticeAt, child.streakDays, now);
  const xp = child.xp + rewards.xp;
  const coins = child.coins + rewards.coins;
  const level = Math.floor(xp / 100) + 1;
  await db.update(childProfiles).set({ xp, coins, level, streakDays: nextStreak, lastPracticeAt: now }).where(eq(childProfiles.id, child.id));
  const currentSkill = skillByKey[question.skillKey];
  let newlyUnlockedWorldKey: string | null = null;
  if (currentSkill) {
    const worldSkills = starterSkills.filter(item => item.worldKey === currentSkill.worldKey).map(item => item.key);
    const allProgress = await db.select().from(skillProgress).where(eq(skillProgress.childId, child.id));
    const masteredWorld = worldSkills.length > 0 && worldSkills.every(key => (key === question.skillKey ? mastery : allProgress.find(item => item.skillKey === key)?.mastery ?? 0) >= 60);
    if (masteredWorld) {
      await db.update(worldProgress).set({ stars: 3, isUnlocked: true }).where(and(eq(worldProgress.childId, child.id), eq(worldProgress.worldKey, currentSkill.worldKey)));
      const worldIndex = starterWorlds.findIndex(item => item.key === currentSkill.worldKey);
      const nextWorld = starterWorlds[worldIndex + 1];
      if (nextWorld) {
        newlyUnlockedWorldKey = nextWorld.key;
        await db.update(worldProgress).set({ isUnlocked: true }).where(and(eq(worldProgress.childId, child.id), eq(worldProgress.worldKey, nextWorld.key)));
      }
    }
  }
  if (rewards.xp) await db.insert(rewardTransactions).values({ id: randomUUID(), childId: child.id, kind: "xp", amount: rewards.xp, reasonKey: isCorrect ? "rewards.correctAnswer" : "rewards.braveTry" });
  if (rewards.coins) await db.insert(rewardTransactions).values({ id: randomUUID(), childId: child.id, kind: "coins", amount: rewards.coins, reasonKey: "rewards.correctAnswer" });
  const periodKey = dayKey(now);
  const dailyQuestRows = await db.select().from(questProgress).where(and(eq(questProgress.childId, child.id), eq(questProgress.questKey, "daily-five"), eq(questProgress.periodKey, periodKey))).limit(1);
  const quest = dailyQuestRows[0];
  const questValue = Math.min(starterQuest.target, (quest?.progress ?? 0) + 1);
  await db.insert(questProgress).values({ id: quest?.id ?? randomUUID(), childId: child.id, questKey: "daily-five", periodKey, progress: questValue, completedAt: questValue >= starterQuest.target ? now : null })
    .onDuplicateKeyUpdate({ set: { progress: questValue, completedAt: questValue >= starterQuest.target ? now : null } });
  const unlocked = [] as string[];
  if (attempts === 1) unlocked.push("first-spark");
  if (nextStreak >= 3) unlocked.push("three-day-streak");
  if (mastery >= 80 && question.skillKey === "count-to-20") unlocked.push("number-explorer");
  for (const achievementKey of unlocked) {
    await db.insert(childAchievements).values({ id: randomUUID(), childId: child.id, achievementKey }).onDuplicateKeyUpdate({ set: { achievementKey } });
  }
  return { isCorrect, rewards, mastery, level, xp, coins, streakDays: nextStreak, quest: { progress: questValue, target: starterQuest.target, completed: questValue >= starterQuest.target }, unlockedAchievementKeys: unlocked, newlyUnlockedWorldKey };
}

export async function getChildDashboard(userId: number, childId: string) {
  const db = await requireDb();
  const child = await assertOwnedChild(userId, childId);
  const [progress, recentAttempts, unlocked, questRows, worldRows, sessionRows] = await Promise.all([
    db.select().from(skillProgress).where(eq(skillProgress.childId, child.id)),
    db.select().from(questionAttempts).where(eq(questionAttempts.childId, child.id)).orderBy(desc(questionAttempts.createdAt)).limit(8),
    db.select().from(childAchievements).where(eq(childAchievements.childId, child.id)),
    db.select().from(questProgress).where(and(eq(questProgress.childId, child.id), eq(questProgress.questKey, "daily-five"), eq(questProgress.periodKey, dayKey(new Date())))).limit(1),
    db.select().from(worldProgress).where(eq(worldProgress.childId, child.id)),
    db.select().from(learningSessions).where(eq(learningSessions.childId, child.id)),
  ]);
  const weakest = [...progress].sort((a, b) => a.mastery - b.mastery)[0];
  const totalAttempts = progress.reduce((sum, item) => sum + item.attempts, 0);
  const totalCorrect = progress.reduce((sum, item) => sum + item.correctAnswers, 0);
  return {
    child,
    skillProgress: progress,
    worldProgress: worldRows,
    recentAttempts,
    achievements: unlocked.map(item => item.achievementKey),
    totalAttempts,
    learningSeconds: sessionRows.reduce((total, session) => total + (session.completedAt ? session.durationSeconds : 0), 0),
    accuracy: totalAttempts ? Math.round((totalCorrect / totalAttempts) * 100) : null,
    recommendationKey: weakest ? "recommendations.practiceSkill" : "recommendations.startAdventure",
    recommendationSkillKey: weakest?.skillKey ?? "count-to-20",
    dailyQuest: { key: starterQuest.key, titleKey: starterQuest.titleKey, progress: questRows[0]?.progress ?? 0, target: starterQuest.target, rewardXp: starterQuest.rewardXp, rewardCoins: starterQuest.rewardCoins },
  };
}

export async function getCurriculum() {
  await seedStarterContent();
  const db = await requireDb();
  const [worldRows, skillRows, lessonRows] = await Promise.all([
    db.select().from(worlds).where(eq(worlds.isPublished, true)),
    db.select().from(skills).where(eq(skills.isPublished, true)),
    db.select().from(lessons),
  ]);
  return { worlds: worldRows.sort((a, b) => a.order - b.order), skills: skillRows.sort((a, b) => a.order - b.order), lessons: lessonRows };
}
