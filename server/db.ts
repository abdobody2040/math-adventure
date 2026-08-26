import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { randomUUID } from "node:crypto";
import {
  achievements,
  adaptivePerformanceSnapshots,
  adaptiveRecommendations,
  analyticsEvents,
  bossAttempts,
  bossDefinitions,
  childAchievements,
  childInventory,
  childPets,
  childProfiles,
  InsertUser,
  learningSessions,
  lessons,
  inventoryItems,
  offlineSyncOperations,
  parentProfiles,
  parentPreferences,
  pets,
  questionAttempts,
  questionSessions,
  questionTemplates,
  questProgress,
  quests,
  rewardTransactions,
  skillProgress,
  skills,
  users,
  weeklyReports,
  worldProgress,
  worlds,
} from "../drizzle/schema";
import { skillByKey, starterAchievements, starterBosses, starterInventoryItems, starterLessons, starterPets, starterQuest, starterQuestionTemplates, starterQuests, starterSkills, starterWorlds } from "../shared/learningContent";
import { activityForAdaptiveAction, generateBossQuestion, masteryFrom, recommendAdaptiveNext, rewardForAttempt } from "./learningEngine";
import { ENV } from "./_core/env";
import { assertChildDataExportAllowed } from "./parentPrivacy";
import { calculateBossCompletion, calculateBossHealth, createBossQuestionDraft } from "./bossFlow";
import { recentPerformanceMetrics, selectAdaptiveSkill } from "./adaptiveSelection";
import { applyPersistedPerformanceGuard, resolveAdaptiveQuestionTarget } from "./nextQuestionTarget";
import { buildAggregateAnalytics, safeAnalyticsPayload } from "./privacyAnalytics";
import { processQueuedAnswer } from "./offlineSync";
import { inventoryEquipPlan, petEquipPlan } from "./rewardEquipment";
import { activeQuestForPeriod } from "./questSchedule";

let _db: ReturnType<typeof drizzle> | null = null;
let curriculumCache: { expiresAt: number; value: any } | null = null;
const parentProfileCache = new Map<number, { expiresAt: number; profile: { id: string; userId: number } }>();

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
  await Promise.all([
    db.insert(worlds).values(starterWorlds.map(world => ({ ...world, isPublished: true }))).onDuplicateKeyUpdate({ set: { isPublished: true } }),
    db.insert(skills).values(starterSkills.map(skill => ({ ...skill, isPublished: true }))).onDuplicateKeyUpdate({ set: { isPublished: true } }),
    db.insert(lessons).values(starterLessons).onDuplicateKeyUpdate({ set: { estimatedMinutes: 6 } }),
    db.insert(questionTemplates).values(starterQuestionTemplates.map(({ interaction: _interaction, ...template }) => ({ ...template, isEnabled: true }))).onDuplicateKeyUpdate({ set: { isEnabled: true } }),
    db.insert(quests).values(starterQuests).onDuplicateKeyUpdate({ set: { target: starterQuest.target } }),
    db.insert(achievements).values(starterAchievements).onDuplicateKeyUpdate({ set: { iconKey: "sparkles" } }),
    db.insert(bossDefinitions).values(starterBosses).onDuplicateKeyUpdate({ set: { health: 100 } }),
    db.insert(inventoryItems).values(starterInventoryItems.map(item => ({ ...item, isPublished: true }))).onDuplicateKeyUpdate({ set: { isPublished: true } }),
    db.insert(pets).values(starterPets.map(pet => ({ ...pet, isPublished: true }))).onDuplicateKeyUpdate({ set: { isPublished: true } }),
  ]);
  curriculumCache = null;
}

async function getOrCreateParentProfile(userId: number): Promise<{ id: string; userId: number }> {
  const cached = parentProfileCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.profile;
  const db = await requireDb();
  const existing = await db.select({ id: parentProfiles.id, userId: parentProfiles.userId }).from(parentProfiles).where(eq(parentProfiles.userId, userId)).limit(1);
  if (existing[0]) {
    parentProfileCache.set(userId, { profile: existing[0], expiresAt: Date.now() + 10 * 60 * 1000 });
    return existing[0];
  }
  const profile = { id: randomUUID(), userId };
  await db.insert(parentProfiles).values(profile);
  parentProfileCache.set(userId, { profile, expiresAt: Date.now() + 10 * 60 * 1000 });
  return profile;
}

async function assertOwnedChild(userId: number, childId: string) {
  const db = await requireDb();
  const parent = await getOrCreateParentProfile(userId);
  const child = await db.select().from(childProfiles).where(and(eq(childProfiles.id, childId), eq(childProfiles.parentId, parent.id))).limit(1);
  if (!child[0]) throw new Error("access.childNotFound");
  return child[0];
}

async function ensureChildWorldProgress(childId: string) {
  const db = await requireDb();
  await db.insert(worldProgress).values(starterWorlds.map(world => ({ id: randomUUID(), childId, worldKey: world.key, isUnlocked: world.order === 1, stars: 0 }))).onDuplicateKeyUpdate({ set: { id: sql`${worldProgress.id}` } });
}

export async function listChildren(userId: number) {
  const db = await requireDb();
  const parent = await getOrCreateParentProfile(userId);
  return db.select().from(childProfiles).where(and(eq(childProfiles.parentId, parent.id), isNull(childProfiles.deletedAt)));
}

export async function softDeleteChild(userId: number, childId: string) {
  const db = await requireDb();
  await assertOwnedChild(userId, childId);
  await db.update(childProfiles).set({ deletedAt: new Date() }).where(eq(childProfiles.id, childId));
  return { success: true } as const;
}

export async function getParentPreferences(userId: number) {
  const db = await requireDb();
  const parent = await getOrCreateParentProfile(userId);
  const row = (await db.select().from(parentPreferences).where(eq(parentPreferences.parentId, parent.id)).limit(1))[0];
  if (row) return row;
  const created = { id: randomUUID(), parentId: parent.id };
  await db.insert(parentPreferences).values(created);
  return { ...created, weeklyReportEnabled: true, learningReminderEnabled: true, dataExportAllowed: true };
}

export async function updateParentPreferences(userId: number, input: { weeklyReportEnabled?: boolean; learningReminderEnabled?: boolean; dataExportAllowed?: boolean }) {
  const db = await requireDb();
  const parent = await getOrCreateParentProfile(userId);
  await getParentPreferences(userId);
  await db.update(parentPreferences).set(input).where(eq(parentPreferences.parentId, parent.id));
  return getParentPreferences(userId);
}

export async function exportChildData(userId: number, childId: string) {
  const db = await requireDb();
  const preferences = await getParentPreferences(userId);
  assertChildDataExportAllowed(preferences.dataExportAllowed);
  const child = await assertOwnedChild(userId, childId);
  const [progress, attempts, sessions, achievementsForChild, inventory, petsForChild] = await Promise.all([
    db.select().from(skillProgress).where(eq(skillProgress.childId, child.id)),
    db.select().from(questionAttempts).where(eq(questionAttempts.childId, child.id)),
    db.select().from(learningSessions).where(eq(learningSessions.childId, child.id)),
    db.select().from(childAchievements).where(eq(childAchievements.childId, child.id)),
    db.select().from(childInventory).where(eq(childInventory.childId, child.id)),
    db.select().from(childPets).where(eq(childPets.childId, child.id)),
  ]);
  return { exportedAt: new Date().toISOString(), child, progress, attempts, sessions, achievements: achievementsForChild, inventory, pets: petsForChild };
}

export async function getWeeklyReport(userId: number, childId: string) {
  const db = await requireDb();
  const child = await assertOwnedChild(userId, childId);
  const weekKey = new Date().toISOString().slice(0, 10);
  const attempts = await db.select().from(questionAttempts).where(eq(questionAttempts.childId, child.id));
  const summary = { attempts: attempts.length, correct: attempts.filter(item => item.isCorrect).length, accuracy: attempts.length ? Math.round(attempts.filter(item => item.isCorrect).length / attempts.length * 100) : 0 };
  await db.insert(weeklyReports).values({ id: randomUUID(), childId: child.id, weekKey, summary }).onDuplicateKeyUpdate({ set: { summary } });
  return { weekKey, summary };
}

export async function getAdminAnalyticsSummary() {
  const db = await requireDb();
  const [children, attempts, events, worldsCount, skillsCount] = await Promise.all([
    db.select({ id: childProfiles.id }).from(childProfiles).where(isNull(childProfiles.deletedAt)),
    db.select().from(questionAttempts).orderBy(desc(questionAttempts.createdAt)).limit(500),
    db.select().from(analyticsEvents).orderBy(desc(analyticsEvents.createdAt)).limit(500),
    db.select({ key: worlds.key }).from(worlds).where(eq(worlds.isPublished, true)),
    db.select({ key: skills.key }).from(skills).where(eq(skills.isPublished, true)),
  ]);
  return buildAggregateAnalytics({ activeChildren: children.length, attempts, events, publishedWorlds: worldsCount.length, publishedSkills: skillsCount.length });
}

export async function getAdminContent() {
  const db = await requireDb();
  await seedStarterContent();
  const [worldRows, skillRows, templateRows, questRows, rewardRows] = await Promise.all([
    db.select().from(worlds).orderBy(worlds.order),
    db.select().from(skills).orderBy(skills.worldKey, skills.order),
    db.select().from(questionTemplates).orderBy(questionTemplates.skillKey, questionTemplates.difficulty),
    db.select().from(quests).orderBy(quests.isDaily, quests.key),
    db.select().from(inventoryItems).orderBy(inventoryItems.category, inventoryItems.key),
  ]);
  return { worlds: worldRows, skills: skillRows, questionTemplates: templateRows, quests: questRows, rewards: rewardRows };
}

export async function adminSaveWorld(input: { key: string; order: number; nameKey: string; descriptionKey: string; accent: string; iconKey: string; isPublished: boolean }) {
  const db = await requireDb();
  await db.insert(worlds).values(input).onDuplicateKeyUpdate({ set: { order: input.order, nameKey: input.nameKey, descriptionKey: input.descriptionKey, accent: input.accent, iconKey: input.iconKey, isPublished: input.isPublished } });
  curriculumCache = null;
  return { success: true } as const;
}

export async function adminSaveSkill(input: { key: string; worldKey: string; order: number; nameKey: string; generatorKey: string; isPublished: boolean }) {
  const db = await requireDb();
  await db.insert(skills).values(input).onDuplicateKeyUpdate({ set: { worldKey: input.worldKey, order: input.order, nameKey: input.nameKey, generatorKey: input.generatorKey, isPublished: input.isPublished } });
  curriculumCache = null;
  return { success: true } as const;
}

export async function adminSaveQuestionTemplate(input: { key: string; skillKey: string; kind: string; difficulty: number; isEnabled: boolean }) {
  const db = await requireDb();
  await db.insert(questionTemplates).values(input).onDuplicateKeyUpdate({ set: { skillKey: input.skillKey, kind: input.kind, difficulty: input.difficulty, isEnabled: input.isEnabled } });
  return { success: true } as const;
}

export async function adminSaveQuest(input: { key: string; titleKey: string; target: number; rewardXp: number; rewardCoins: number; isDaily: boolean; isEnabled: boolean }) {
  const db = await requireDb();
  await db.insert(quests).values(input).onDuplicateKeyUpdate({ set: { titleKey: input.titleKey, target: input.target, rewardXp: input.rewardXp, rewardCoins: input.rewardCoins, isDaily: input.isDaily, isEnabled: input.isEnabled } });
  return { success: true } as const;
}

export async function adminSaveReward(input: { key: string; titleKey: string; category: "outfit" | "accessory" | "backpack" | "effect" | "pet"; costCoins: number; assetKey: string; isPublished: boolean }) {
  const db = await requireDb();
  await db.insert(inventoryItems).values(input).onDuplicateKeyUpdate({ set: { titleKey: input.titleKey, category: input.category, costCoins: input.costCoins, assetKey: input.assetKey, isPublished: input.isPublished } });
  return { success: true } as const;
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

export type PersistedAdaptiveQuestionInput = {
  progressRows: { skillKey: string; mastery: number }[];
  unlockedWorldKeys: string[];
  recommendations: { skillKey: string; action: "practice" | "advance" | "review" | "remediate"; difficulty: number }[];
  snapshots: { skillKey: string; correctRateBps: number; averageResponseTimeMs: number; usedHint: boolean }[];
  requestedSkillKey?: string;
};

export function resolvePersistedAdaptiveQuestion(input: PersistedAdaptiveQuestionInput) {
  const unlockedWorlds = new Set(input.unlockedWorldKeys);
  const unlockedSkills = starterSkills.filter(skill => unlockedWorlds.has(skill.worldKey));
  const progressBySkill = new Map(input.progressRows.map(item => [item.skillKey, item]));
  const target = resolveAdaptiveQuestionTarget({
    unlockedSkills: unlockedSkills.length ? unlockedSkills : starterSkills,
    masteryBySkill: new Map(progressBySkill.entries().map(([skillKey, progress]) => [skillKey, progress.mastery])),
    requestedSkillKey: input.requestedSkillKey,
    recommendation: input.recommendations[0] ? { skillKey: input.recommendations[0].skillKey, action: input.recommendations[0].action, difficulty: input.recommendations[0].difficulty } : undefined,
  });
  const guardedTarget = applyPersistedPerformanceGuard(target, input.snapshots.find(snapshot => snapshot.skillKey === target.skillKey));
  return { ...guardedTarget, activity: activityForAdaptiveAction(guardedTarget.action) };
}

export async function getAdaptiveNextQuestion(userId: number, input: { childId: string; requestedSkillKey?: string }, readForTest?: () => Promise<Omit<PersistedAdaptiveQuestionInput, "requestedSkillKey">>) {
  if (readForTest) return resolvePersistedAdaptiveQuestion({ ...(await readForTest()), requestedSkillKey: input.requestedSkillKey });
  const db = await requireDb();
  await seedStarterContent();
  const child = await assertOwnedChild(userId, input.childId);
  await ensureChildWorldProgress(child.id);
  const [progressRows, worldRows, recommendations, snapshots] = await Promise.all([
    db.select().from(skillProgress).where(eq(skillProgress.childId, child.id)),
    db.select().from(worldProgress).where(and(eq(worldProgress.childId, child.id), eq(worldProgress.isUnlocked, true))),
    db.select().from(adaptiveRecommendations).where(and(eq(adaptiveRecommendations.childId, child.id), isNull(adaptiveRecommendations.dismissedAt))).orderBy(desc(adaptiveRecommendations.createdAt)).limit(1),
    db.select().from(adaptivePerformanceSnapshots).where(eq(adaptivePerformanceSnapshots.childId, child.id)).orderBy(desc(adaptivePerformanceSnapshots.createdAt)).limit(12),
  ]);
  return resolvePersistedAdaptiveQuestion({ progressRows, unlockedWorldKeys: worldRows.map(item => item.worldKey), recommendations, snapshots, requestedSkillKey: input.requestedSkillKey });
}

export async function updateChild(userId: number, childId: string, input: { displayName?: string; age?: number; grade?: string; avatarKey?: string; locale?: "en" | "ar" }) {
  const db = await requireDb();
  await assertOwnedChild(userId, childId);
  await db.update(childProfiles).set(input).where(eq(childProfiles.id, childId));
  const child = await db.select().from(childProfiles).where(eq(childProfiles.id, childId)).limit(1);
  return child[0]!;
}

export async function getChildRewards(userId: number, childId: string) {
  const db = await requireDb();
  await assertOwnedChild(userId, childId);
  const [inventory, ownedPets, catalog, petCatalog] = await Promise.all([
    db.select().from(childInventory).where(eq(childInventory.childId, childId)),
    db.select().from(childPets).where(eq(childPets.childId, childId)),
    db.select().from(inventoryItems).where(eq(inventoryItems.isPublished, true)),
    db.select().from(pets).where(eq(pets.isPublished, true)),
  ]);
  return { inventory, pets: ownedPets, catalog, petCatalog };
}

export async function redeemInventoryItem(userId: number, input: { childId: string; itemKey: string }) {
  const db = await requireDb();
  const child = await assertOwnedChild(userId, input.childId);
  const item = (await db.select().from(inventoryItems).where(and(eq(inventoryItems.key, input.itemKey), eq(inventoryItems.isPublished, true))).limit(1))[0];
  if (!item) throw new Error("rewards.error.itemUnavailable");
  if (child.coins < item.costCoins) throw new Error("rewards.error.notEnoughCoins");
  await Promise.all([
    db.insert(childInventory).values({ id: randomUUID(), childId: child.id, itemKey: item.key }).onDuplicateKeyUpdate({ set: { itemKey: item.key } }),
    db.update(childProfiles).set({ coins: child.coins - item.costCoins }).where(eq(childProfiles.id, child.id)),
    db.insert(analyticsEvents).values({ id: randomUUID(), parentId: child.parentId, childId: child.id, eventKey: "reward_redeemed", payload: safeAnalyticsPayload("reward_redeemed", { itemKey: item.key }) }),
  ]);
  return { success: true, coins: child.coins - item.costCoins } as const;
}

export async function unlockPet(userId: number, input: { childId: string; petKey: string }) {
  const db = await requireDb();
  const child = await assertOwnedChild(userId, input.childId);
  const pet = (await db.select().from(pets).where(and(eq(pets.key, input.petKey), eq(pets.isPublished, true))).limit(1))[0];
  if (!pet) throw new Error("rewards.error.petUnavailable");
  if (child.coins < pet.unlockCoins) throw new Error("rewards.error.notEnoughCoins");
  await Promise.all([
    db.insert(childPets).values({ id: randomUUID(), childId: child.id, petKey: pet.key }).onDuplicateKeyUpdate({ set: { petKey: pet.key } }),
    db.update(childProfiles).set({ coins: child.coins - pet.unlockCoins }).where(eq(childProfiles.id, child.id)),
    db.insert(analyticsEvents).values({ id: randomUUID(), parentId: child.parentId, childId: child.id, eventKey: "pet_unlocked", payload: safeAnalyticsPayload("pet_unlocked", { petKey: pet.key }) }),
  ]);
  return { success: true, coins: child.coins - pet.unlockCoins } as const;
}

export async function equipInventoryItem(userId: number, input: { childId: string; itemKey: string }) {
  const db = await requireDb();
  const child = await assertOwnedChild(userId, input.childId);
  const owned = (await db.select().from(childInventory).where(and(eq(childInventory.childId, child.id), eq(childInventory.itemKey, input.itemKey))).limit(1))[0];
  if (!owned) throw new Error("rewards.error.itemNotOwned");
  const item = (await db.select().from(inventoryItems).where(eq(inventoryItems.key, input.itemKey)).limit(1))[0];
  if (!item) throw new Error("rewards.error.itemUnavailable");
  const categoryKeys = (await db.select({ key: inventoryItems.key }).from(inventoryItems).where(eq(inventoryItems.category, item.category))).map(row => row.key);
  const plan = inventoryEquipPlan(categoryKeys, item.key);
  await Promise.all([
    ...plan.unequipItemKeys.map(itemKey => db.update(childInventory).set({ equipped: false }).where(and(eq(childInventory.childId, child.id), eq(childInventory.itemKey, itemKey)))),
    db.update(childInventory).set({ equipped: true }).where(eq(childInventory.id, owned.id)),
  ]);
  return { success: true, equippedItemKey: item.key, category: item.category } as const;
}

export async function equipPet(userId: number, input: { childId: string; petKey: string }) {
  const db = await requireDb();
  const child = await assertOwnedChild(userId, input.childId);
  const owned = (await db.select().from(childPets).where(and(eq(childPets.childId, child.id), eq(childPets.petKey, input.petKey))).limit(1))[0];
  if (!owned) throw new Error("rewards.error.petNotOwned");
  const plan = petEquipPlan(owned.petKey);
  await Promise.all([
    ...(plan.clearAllPets ? [db.update(childPets).set({ equipped: false }).where(eq(childPets.childId, child.id))] : []),
    db.update(childPets).set({ equipped: true }).where(eq(childPets.id, owned.id)),
  ]);
  return { success: true, equippedPetKey: owned.petKey } as const;
}

export async function createLearningSession(userId: number, input: { childId: string; skillKey: string; mode: "lesson" | "battle" }) {
  const db = await requireDb();
  const child = await assertOwnedChild(userId, input.childId);
  const session = { id: randomUUID(), ...input };
  await Promise.all([
    db.insert(learningSessions).values(session),
    db.insert(analyticsEvents).values({ id: randomUUID(), parentId: child.parentId, childId: child.id, eventKey: "session_started", payload: safeAnalyticsPayload("session_started", { skillKey: input.skillKey, mode: input.mode }) }),
  ]);
  return session;
}

export async function completeLearningSession(userId: number, input: { childId: string; sessionId: string; durationSeconds: number }) {
  const db = await requireDb();
  await assertOwnedChild(userId, input.childId);
  const existing = await db.select().from(learningSessions).where(and(eq(learningSessions.id, input.sessionId), eq(learningSessions.childId, input.childId))).limit(1);
  if (!existing[0]) throw new Error("learning.error.sessionNotFound");
  const durationSeconds = Math.min(15 * 60, Math.max(1, input.durationSeconds));
  if (!existing[0].completedAt) {
    const now = new Date();
    await db.update(learningSessions).set({ completedAt: now, durationSeconds }).where(eq(learningSessions.id, input.sessionId));
    const dailyQuest = activeQuestForPeriod(starterQuests, true, now);
    if (dailyQuest?.key === "daily-lesson") {
      const periodKey = dayKey(now);
      const current = (await db.select().from(questProgress).where(and(eq(questProgress.childId, input.childId), eq(questProgress.questKey, dailyQuest.key), eq(questProgress.periodKey, periodKey))).limit(1))[0];
      const progress = Math.min(dailyQuest.target, (current?.progress ?? 0) + 1);
      await db.insert(questProgress).values({ id: current?.id ?? randomUUID(), childId: input.childId, questKey: dailyQuest.key, periodKey, progress, completedAt: progress >= dailyQuest.target ? now : null }).onDuplicateKeyUpdate({ set: { progress, completedAt: progress >= dailyQuest.target ? now : null } });
    }
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

export async function startBossAttempt(userId: number, input: { childId: string; worldKey: string }) {
  const db = await requireDb();
  const child = await assertOwnedChild(userId, input.childId);
  await ensureChildWorldProgress(child.id);
  const [progress, definition] = await Promise.all([
    db.select().from(worldProgress).where(and(eq(worldProgress.childId, child.id), eq(worldProgress.worldKey, input.worldKey), eq(worldProgress.isUnlocked, true))).limit(1),
    db.select().from(bossDefinitions).where(eq(bossDefinitions.worldKey, input.worldKey)).limit(1),
  ]);
  if (!progress[0] || !definition[0]) throw new Error("learning.error.bossLocked");
  const attempt = { id: randomUUID(), childId: child.id, worldKey: input.worldKey, healthRemaining: definition[0].health };
  await Promise.all([
    db.insert(bossAttempts).values(attempt),
    db.insert(analyticsEvents).values({ id: randomUUID(), parentId: child.parentId, childId: child.id, eventKey: "boss_started", payload: safeAnalyticsPayload("boss_started", { worldKey: input.worldKey }) }),
  ]);
  return { ...attempt, health: definition[0].health, titleKey: definition[0].titleKey };
}

export async function createBossQuestion(userId: number, input: { childId: string; bossAttemptId: string }) {
  const db = await requireDb();
  await assertOwnedChild(userId, input.childId);
  const attempt = (await db.select().from(bossAttempts).where(and(eq(bossAttempts.id, input.bossAttemptId), eq(bossAttempts.childId, input.childId))).limit(1))[0];
  if (!attempt || attempt.completedAt) throw new Error("learning.error.bossUnavailable");
  const generated = createBossQuestionDraft(attempt.worldKey, attempt.id, Date.now());
  const session = await createQuestionSession(userId, input.childId, generated.skillKey, generated.presentation, generated.correctAnswer);
  return { questionSessionId: session.id, expiresAt: session.expiresAt, presentation: generated.presentation, explanationKey: generated.explanationKey, skillKey: generated.skillKey, healthRemaining: attempt.healthRemaining };
}

export async function recordBossAnswer(userId: number, input: { childId: string; bossAttemptId: string; questionSessionId: string; answer: string; responseTimeMs: number; usedHint: boolean }) {
  const db = await requireDb();
  const child = await assertOwnedChild(userId, input.childId);
  const attempt = (await db.select().from(bossAttempts).where(and(eq(bossAttempts.id, input.bossAttemptId), eq(bossAttempts.childId, child.id))).limit(1))[0];
  if (!attempt || attempt.completedAt) throw new Error("learning.error.bossUnavailable");
  const result = await recordAnswer(userId, input);
  const definition = (await db.select().from(bossDefinitions).where(eq(bossDefinitions.worldKey, attempt.worldKey)).limit(1))[0];
  const healthRemaining = calculateBossHealth(attempt.healthRemaining, result.isCorrect);
  const completed = healthRemaining === 0;
  await db.update(bossAttempts).set({ healthRemaining, completedAt: completed ? new Date() : null }).where(eq(bossAttempts.id, attempt.id));
  let completionRewards = { xp: 0, coins: 0, unlockedWorldKey: null as string | null };
  if (completed && definition) {
    const latestChild = (await db.select().from(childProfiles).where(eq(childProfiles.id, child.id)).limit(1))[0]!;
    const completion = calculateBossCompletion({ worldKey: attempt.worldKey, healthRemaining, rewardXp: definition.rewardXp, rewardCoins: definition.rewardCoins, currentXp: latestChild.xp, currentCoins: latestChild.coins });
    const { xp, coins, level } = completion;
    const nextWorld = completion.completionRewards.unlockedWorldKey ? starterWorlds.find(world => world.key === completion.completionRewards.unlockedWorldKey) : undefined;
    const writes: Promise<unknown>[] = [
      db.update(childProfiles).set({ xp, coins, level }).where(eq(childProfiles.id, child.id)),
      db.insert(rewardTransactions).values([{ id: randomUUID(), childId: child.id, kind: "xp", amount: definition.rewardXp, reasonKey: "rewards.bossComplete" }, { id: randomUUID(), childId: child.id, kind: "coins", amount: definition.rewardCoins, reasonKey: "rewards.bossComplete" }]),
    ];
    if (definition.badgeKey) writes.push(db.insert(childAchievements).values({ id: randomUUID(), childId: child.id, achievementKey: definition.badgeKey }).onDuplicateKeyUpdate({ set: { achievementKey: definition.badgeKey } }));
    if (nextWorld) writes.push(db.update(worldProgress).set({ isUnlocked: true }).where(and(eq(worldProgress.childId, child.id), eq(worldProgress.worldKey, nextWorld.key))));
    const now = new Date();
    const weeklyQuest = activeQuestForPeriod(starterQuests, false, now);
    if (weeklyQuest?.key === "weekly-battle") {
      const periodKey = weekKey(now);
      const current = (await db.select().from(questProgress).where(and(eq(questProgress.childId, child.id), eq(questProgress.questKey, weeklyQuest.key), eq(questProgress.periodKey, periodKey))).limit(1))[0];
      const progress = Math.min(weeklyQuest.target, (current?.progress ?? 0) + 1);
      writes.push(db.insert(questProgress).values({ id: current?.id ?? randomUUID(), childId: child.id, questKey: weeklyQuest.key, periodKey, progress, completedAt: progress >= weeklyQuest.target ? now : null }).onDuplicateKeyUpdate({ set: { progress, completedAt: progress >= weeklyQuest.target ? now : null } }));
    }
    await Promise.all(writes);
    completionRewards = completion.completionRewards;
  }
  return { ...result, boss: { healthRemaining, completed, completionRewards } };
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function weekKey(date: Date) {
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - mondayOffset));
  return monday.toISOString().slice(0, 10);
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
  const periodKey = dayKey(now);
  const currentWeekKey = weekKey(now);
  const dailyQuest = activeQuestForPeriod(starterQuests, true, now) ?? starterQuest;
  const weeklyQuest = activeQuestForPeriod(starterQuests, false, now) ?? starterQuest;
  const [progressRows, dailyQuestRows, weeklyQuestRows, recentSkillAttempts] = await Promise.all([
    db.select().from(skillProgress).where(and(eq(skillProgress.childId, child.id), eq(skillProgress.skillKey, question.skillKey))).limit(1),
    db.select().from(questProgress).where(and(eq(questProgress.childId, child.id), eq(questProgress.questKey, dailyQuest.key), eq(questProgress.periodKey, periodKey))).limit(1),
    db.select().from(questProgress).where(and(eq(questProgress.childId, child.id), eq(questProgress.questKey, weeklyQuest.key), eq(questProgress.periodKey, currentWeekKey))).limit(1),
    db.select().from(questionAttempts).where(and(eq(questionAttempts.childId, child.id), eq(questionAttempts.skillKey, question.skillKey))).orderBy(desc(questionAttempts.createdAt)).limit(8),
  ]);
  const existing = progressRows[0];
  const attempts = (existing?.attempts ?? 0) + 1;
  const correctAnswers = (existing?.correctAnswers ?? 0) + (isCorrect ? 1 : 0);
  const mastery = masteryFrom(attempts, correctAnswers, input.responseTimeMs);
  const recentMetrics = recentPerformanceMetrics([...recentSkillAttempts.map(item => ({ isCorrect: item.isCorrect, responseTimeMs: item.responseTimeMs })), { isCorrect, responseTimeMs: input.responseTimeMs }]);
  const adaptive = recommendAdaptiveNext({ attempts, correctAnswers, mastery, responseTimeMs: input.responseTimeMs, usedHint: input.usedHint, recentCorrectRate: recentMetrics.correctRate, recentAverageResponseTimeMs: recentMetrics.averageResponseTimeMs });
  const recommendationSkillKey = selectAdaptiveSkill({ action: adaptive.action, answeredSkillKey: question.skillKey, availableSkills: starterSkills });
  const progressId = existing?.id ?? randomUUID();
  const nextStreak = calculateStreak(child.lastPracticeAt, child.streakDays, now);
  const xp = child.xp + rewards.xp;
  const coins = child.coins + rewards.coins;
  const level = Math.floor(xp / 100) + 1;
  const currentSkill = skillByKey[question.skillKey];
  let newlyUnlockedWorldKey: string | null = null;
  const worldWrites: Promise<unknown>[] = [];
  if (currentSkill && mastery >= 60) {
    const worldSkills = starterSkills.filter(item => item.worldKey === currentSkill.worldKey).map(item => item.key);
    const allProgress = await db.select().from(skillProgress).where(eq(skillProgress.childId, child.id));
    const masteredWorld = worldSkills.length > 0 && worldSkills.every(key => (key === question.skillKey ? mastery : allProgress.find(item => item.skillKey === key)?.mastery ?? 0) >= 60);
    if (masteredWorld) {
      worldWrites.push(db.update(worldProgress).set({ stars: 3, isUnlocked: true }).where(and(eq(worldProgress.childId, child.id), eq(worldProgress.worldKey, currentSkill.worldKey))));
      const worldIndex = starterWorlds.findIndex(item => item.key === currentSkill.worldKey);
      const nextWorld = starterWorlds[worldIndex + 1];
      if (nextWorld) {
        newlyUnlockedWorldKey = nextWorld.key;
        worldWrites.push(db.update(worldProgress).set({ isUnlocked: true }).where(and(eq(worldProgress.childId, child.id), eq(worldProgress.worldKey, nextWorld.key))));
      }
    }
  }
  const quest = dailyQuestRows[0];
  const weeklyProgress = weeklyQuestRows[0];
  const questValue = dailyQuest.key === "daily-five" ? Math.min(dailyQuest.target, (quest?.progress ?? 0) + 1) : (quest?.progress ?? 0);
  const weeklyValue = weeklyQuest.key === "weekly-practice" ? Math.min(weeklyQuest.target, (weeklyProgress?.progress ?? 0) + 1) : (weeklyProgress?.progress ?? 0);
  const unlocked = [] as string[];
  if (attempts === 1) unlocked.push("first-spark");
  if (nextStreak >= 3) unlocked.push("three-day-streak");
  if (mastery >= 80 && question.skillKey === "count-to-20") unlocked.push("number-explorer");
  const writes: Promise<unknown>[] = [
    db.insert(skillProgress).values({ id: progressId, childId: child.id, skillKey: question.skillKey, attempts, correctAnswers, mastery, lastPracticedAt: now }).onDuplicateKeyUpdate({ set: { attempts, correctAnswers, mastery, lastPracticedAt: now } }),
    db.insert(questionAttempts).values({ id: randomUUID(), childId: child.id, sessionId: question.id, skillKey: question.skillKey, submittedAnswer: input.answer, isCorrect, responseTimeMs: input.responseTimeMs, usedHint: input.usedHint }),
    db.update(childProfiles).set({ xp, coins, level, streakDays: nextStreak, lastPracticeAt: now }).where(eq(childProfiles.id, child.id)),
    db.insert(adaptiveRecommendations).values({ id: randomUUID(), childId: child.id, skillKey: recommendationSkillKey, action: adaptive.action, difficulty: adaptive.difficulty, reasonKey: adaptive.reasonKey, priority: adaptive.priority }),
    db.insert(adaptivePerformanceSnapshots).values({ id: randomUUID(), childId: child.id, skillKey: question.skillKey, windowSize: recentSkillAttempts.length + 1, correctRateBps: Math.round((recentMetrics.correctRate ?? 0) * 10000), averageResponseTimeMs: recentMetrics.averageResponseTimeMs ?? input.responseTimeMs, usedHint: input.usedHint }),
    db.insert(analyticsEvents).values({ id: randomUUID(), parentId: child.parentId, childId: child.id, eventKey: "answer_submitted", payload: safeAnalyticsPayload("answer_submitted", { skillKey: question.skillKey, isCorrect, responseTimeMs: input.responseTimeMs, usedHint: input.usedHint }) }),
    ...worldWrites,
  ];
  if (dailyQuest.key === "daily-five") writes.push(db.insert(questProgress).values({ id: quest?.id ?? randomUUID(), childId: child.id, questKey: dailyQuest.key, periodKey, progress: questValue, completedAt: questValue >= dailyQuest.target ? now : null }).onDuplicateKeyUpdate({ set: { progress: questValue, completedAt: questValue >= dailyQuest.target ? now : null } }));
  if (weeklyQuest.key === "weekly-practice") writes.push(db.insert(questProgress).values({ id: weeklyProgress?.id ?? randomUUID(), childId: child.id, questKey: weeklyQuest.key, periodKey: currentWeekKey, progress: weeklyValue, completedAt: weeklyValue >= weeklyQuest.target ? now : null }).onDuplicateKeyUpdate({ set: { progress: weeklyValue, completedAt: weeklyValue >= weeklyQuest.target ? now : null } }));
  if (rewards.xp || rewards.coins) writes.push(db.insert(rewardTransactions).values([
    ...(rewards.xp ? [{ id: randomUUID(), childId: child.id, kind: "xp" as const, amount: rewards.xp, reasonKey: isCorrect ? "rewards.correctAnswer" : "rewards.braveTry" }] : []),
    ...(rewards.coins ? [{ id: randomUUID(), childId: child.id, kind: "coins" as const, amount: rewards.coins, reasonKey: "rewards.correctAnswer" }] : []),
  ]));
  unlocked.forEach(achievementKey => writes.push(db.insert(childAchievements).values({ id: randomUUID(), childId: child.id, achievementKey }).onDuplicateKeyUpdate({ set: { achievementKey } })));
  await Promise.all(writes);
  return { isCorrect, rewards, mastery, adaptive, level, xp, coins, streakDays: nextStreak, quest: { progress: questValue, target: dailyQuest.target, completed: questValue >= dailyQuest.target }, weeklyQuest: { progress: weeklyValue, target: weeklyQuest.target, completed: weeklyValue >= weeklyQuest.target }, unlockedAchievementKeys: unlocked, newlyUnlockedWorldKey };
}

export async function syncOfflineAnswers(userId: number, input: { childId: string; operations: { idempotencyKey: string; questionSessionId: string; answer: string; responseTimeMs: number; usedHint: boolean }[] }) {
  const db = await requireDb();
  await assertOwnedChild(userId, input.childId);
  const results: { idempotencyKey: string; status: "processed" | "duplicate" | "rejected" }[] = [];
  for (const operation of input.operations.slice(0, 20)) {
    const existing = (await db.select().from(offlineSyncOperations).where(and(eq(offlineSyncOperations.childId, input.childId), eq(offlineSyncOperations.idempotencyKey, operation.idempotencyKey))).limit(1))[0];
    if (existing?.processedAt) { results.push({ idempotencyKey: operation.idempotencyKey, status: "duplicate" }); continue; }
    if (!existing) await db.insert(offlineSyncOperations).values({ id: randomUUID(), childId: input.childId, idempotencyKey: operation.idempotencyKey, operationType: "answer", payload: operation });
    const status = await processQueuedAnswer(existing, async () => {
      await recordAnswer(userId, { childId: input.childId, questionSessionId: operation.questionSessionId, answer: operation.answer, responseTimeMs: operation.responseTimeMs, usedHint: operation.usedHint });
      await db.update(offlineSyncOperations).set({ processedAt: new Date() }).where(and(eq(offlineSyncOperations.childId, input.childId), eq(offlineSyncOperations.idempotencyKey, operation.idempotencyKey)));
    });
    results.push({ idempotencyKey: operation.idempotencyKey, status });
  }
  return { results };
}

export async function getChildDashboard(userId: number, childId: string) {
  const db = await requireDb();
  const child = await assertOwnedChild(userId, childId);
  await ensureChildWorldProgress(child.id);
  const now = new Date();
  const dailyQuest = activeQuestForPeriod(starterQuests, true, now) ?? starterQuest;
  const weeklyQuest = activeQuestForPeriod(starterQuests, false, now) ?? starterQuest;
  const [progress, recentAttempts, unlocked, questRows, weeklyQuestRows, worldRows, sessionRows, adaptiveRows, equippedInventoryRows, equippedPetRows] = await Promise.all([
    db.select().from(skillProgress).where(eq(skillProgress.childId, child.id)),
    db.select().from(questionAttempts).where(eq(questionAttempts.childId, child.id)).orderBy(desc(questionAttempts.createdAt)).limit(8),
    db.select().from(childAchievements).where(eq(childAchievements.childId, child.id)),
    db.select().from(questProgress).where(and(eq(questProgress.childId, child.id), eq(questProgress.questKey, dailyQuest.key), eq(questProgress.periodKey, dayKey(now)))).limit(1),
    db.select().from(questProgress).where(and(eq(questProgress.childId, child.id), eq(questProgress.questKey, weeklyQuest.key), eq(questProgress.periodKey, weekKey(now)))).limit(1),
    db.select().from(worldProgress).where(eq(worldProgress.childId, child.id)),
    db.select().from(learningSessions).where(eq(learningSessions.childId, child.id)),
    db.select().from(adaptiveRecommendations).where(and(eq(adaptiveRecommendations.childId, child.id), isNull(adaptiveRecommendations.dismissedAt))).orderBy(desc(adaptiveRecommendations.createdAt)).limit(1),
    db.select().from(childInventory).where(and(eq(childInventory.childId, child.id), eq(childInventory.equipped, true))),
    db.select().from(childPets).where(and(eq(childPets.childId, child.id), eq(childPets.equipped, true))).limit(1),
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
    recommendationKey: adaptiveRows[0]?.reasonKey ?? (weakest ? "recommendations.practiceSkill" : "recommendations.startAdventure"),
    recommendationSkillKey: adaptiveRows[0]?.skillKey ?? weakest?.skillKey ?? "count-to-20",
    adaptive: adaptiveRows[0] ?? null,
    equippedCosmeticKeys: equippedInventoryRows.map(item => item.itemKey),
    equippedPetKey: equippedPetRows[0]?.petKey ?? null,
    dailyQuest: { key: dailyQuest.key, titleKey: dailyQuest.titleKey, progress: questRows[0]?.progress ?? 0, target: dailyQuest.target, rewardXp: dailyQuest.rewardXp, rewardCoins: dailyQuest.rewardCoins },
    weeklyQuest: { key: weeklyQuest.key, titleKey: weeklyQuest.titleKey, progress: weeklyQuestRows[0]?.progress ?? 0, target: weeklyQuest.target, rewardXp: weeklyQuest.rewardXp, rewardCoins: weeklyQuest.rewardCoins },
  };
}

export async function getCurriculum() {
  if (curriculumCache && curriculumCache.expiresAt > Date.now()) return curriculumCache.value;
  await seedStarterContent();
  const db = await requireDb();
  const [worldRows, skillRows, lessonRows] = await Promise.all([
    db.select().from(worlds).where(eq(worlds.isPublished, true)),
    db.select().from(skills).where(eq(skills.isPublished, true)),
    db.select().from(lessons),
  ]);
  const value = { worlds: worldRows.sort((a, b) => a.order - b.order), skills: skillRows.sort((a, b) => a.order - b.order), lessons: lessonRows };
  curriculumCache = { value, expiresAt: Date.now() + 10 * 60 * 1000 };
  return value;
}
