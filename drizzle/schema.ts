import {
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const parentProfiles = mysqlTable(
  "parent_profiles",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("parent_profiles_user_idx").on(table.userId)],
);

export const childProfiles = mysqlTable(
  "child_profiles",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    parentId: varchar("parentId", { length: 36 }).notNull().references(() => parentProfiles.id, { onDelete: "cascade" }),
    displayName: varchar("displayName", { length: 32 }).notNull(),
    age: int("age").notNull(),
    grade: varchar("grade", { length: 32 }).notNull(),
    avatarKey: varchar("avatarKey", { length: 64 }).default("starlight").notNull(),
    locale: mysqlEnum("locale", ["en", "ar"]).default("en").notNull(),
    xp: int("xp").default(0).notNull(),
    coins: int("coins").default(0).notNull(),
    level: int("level").default(1).notNull(),
    streakDays: int("streakDays").default(0).notNull(),
    lastPracticeAt: timestamp("lastPracticeAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("child_profiles_parent_idx").on(table.parentId)],
);

export const worlds = mysqlTable("worlds", {
  key: varchar("key", { length: 64 }).primaryKey(),
  order: int("sortOrder").notNull(),
  nameKey: varchar("nameKey", { length: 128 }).notNull(),
  descriptionKey: varchar("descriptionKey", { length: 128 }).notNull(),
  accent: varchar("accent", { length: 32 }).notNull(),
  iconKey: varchar("iconKey", { length: 32 }).notNull(),
  isPublished: boolean("isPublished").default(true).notNull(),
});

export const skills = mysqlTable(
  "skills",
  {
    key: varchar("key", { length: 64 }).primaryKey(),
    worldKey: varchar("worldKey", { length: 64 }).notNull().references(() => worlds.key, { onDelete: "cascade" }),
    order: int("sortOrder").notNull(),
    nameKey: varchar("nameKey", { length: 128 }).notNull(),
    generatorKey: varchar("generatorKey", { length: 64 }).notNull(),
    isPublished: boolean("isPublished").default(true).notNull(),
  },
  table => [index("skills_world_idx").on(table.worldKey)],
);

export const lessons = mysqlTable(
  "lessons",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    skillKey: varchar("skillKey", { length: 64 }).notNull().references(() => skills.key, { onDelete: "cascade" }),
    titleKey: varchar("titleKey", { length: 128 }).notNull(),
    objectiveKey: varchar("objectiveKey", { length: 128 }).notNull(),
    estimatedMinutes: int("estimatedMinutes").default(6).notNull(),
    order: int("sortOrder").notNull(),
  },
  table => [index("lessons_skill_idx").on(table.skillKey)],
);

export const learningSessions = mysqlTable(
  "learning_sessions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    childId: varchar("childId", { length: 36 }).notNull().references(() => childProfiles.id, { onDelete: "cascade" }),
    skillKey: varchar("skillKey", { length: 64 }).notNull().references(() => skills.key, { onDelete: "cascade" }),
    mode: mysqlEnum("mode", ["lesson", "battle"]).notNull(),
    startedAt: timestamp("startedAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
    durationSeconds: int("durationSeconds").default(0).notNull(),
  },
  table => [index("learning_sessions_child_idx").on(table.childId), index("learning_sessions_completed_idx").on(table.childId, table.completedAt)],
);

export const questionTemplates = mysqlTable(
  "question_templates",
  {
    key: varchar("key", { length: 64 }).primaryKey(),
    skillKey: varchar("skillKey", { length: 64 }).notNull().references(() => skills.key, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 64 }).notNull(),
    difficulty: int("difficulty").default(1).notNull(),
    isEnabled: boolean("isEnabled").default(true).notNull(),
  },
  table => [index("question_templates_skill_idx").on(table.skillKey)],
);

export const questionSessions = mysqlTable(
  "question_sessions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    childId: varchar("childId", { length: 36 }).notNull().references(() => childProfiles.id, { onDelete: "cascade" }),
    skillKey: varchar("skillKey", { length: 64 }).notNull().references(() => skills.key, { onDelete: "cascade" }),
    questionData: json("questionData").notNull(),
    correctAnswer: varchar("correctAnswer", { length: 32 }).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("question_sessions_child_idx").on(table.childId), index("question_sessions_expiry_idx").on(table.expiresAt)],
);

export const questionAttempts = mysqlTable(
  "question_attempts",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    childId: varchar("childId", { length: 36 }).notNull().references(() => childProfiles.id, { onDelete: "cascade" }),
    sessionId: varchar("sessionId", { length: 36 }).notNull().references(() => questionSessions.id, { onDelete: "cascade" }),
    skillKey: varchar("skillKey", { length: 64 }).notNull().references(() => skills.key, { onDelete: "cascade" }),
    submittedAnswer: varchar("submittedAnswer", { length: 32 }).notNull(),
    isCorrect: boolean("isCorrect").notNull(),
    responseTimeMs: int("responseTimeMs").notNull(),
    usedHint: boolean("usedHint").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("question_attempts_child_idx").on(table.childId), index("question_attempts_skill_idx").on(table.childId, table.skillKey)],
);

export const skillProgress = mysqlTable(
  "skill_progress",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    childId: varchar("childId", { length: 36 }).notNull().references(() => childProfiles.id, { onDelete: "cascade" }),
    skillKey: varchar("skillKey", { length: 64 }).notNull().references(() => skills.key, { onDelete: "cascade" }),
    attempts: int("attempts").default(0).notNull(),
    correctAnswers: int("correctAnswers").default(0).notNull(),
    mastery: int("mastery").default(0).notNull(),
    lastPracticedAt: timestamp("lastPracticedAt"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("skill_progress_child_skill_uq").on(table.childId, table.skillKey), index("skill_progress_child_idx").on(table.childId)],
);

export const worldProgress = mysqlTable(
  "world_progress",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    childId: varchar("childId", { length: 36 }).notNull().references(() => childProfiles.id, { onDelete: "cascade" }),
    worldKey: varchar("worldKey", { length: 64 }).notNull().references(() => worlds.key, { onDelete: "cascade" }),
    isUnlocked: boolean("isUnlocked").default(false).notNull(),
    stars: int("stars").default(0).notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("world_progress_child_world_uq").on(table.childId, table.worldKey)],
);

export const quests = mysqlTable("quests", {
  key: varchar("key", { length: 64 }).primaryKey(),
  titleKey: varchar("titleKey", { length: 128 }).notNull(),
  target: int("target").notNull(),
  rewardXp: int("rewardXp").notNull(),
  rewardCoins: int("rewardCoins").notNull(),
  isDaily: boolean("isDaily").default(true).notNull(),
});

export const questProgress = mysqlTable(
  "quest_progress",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    childId: varchar("childId", { length: 36 }).notNull().references(() => childProfiles.id, { onDelete: "cascade" }),
    questKey: varchar("questKey", { length: 64 }).notNull().references(() => quests.key, { onDelete: "cascade" }),
    periodKey: varchar("periodKey", { length: 10 }).notNull(),
    progress: int("progress").default(0).notNull(),
    completedAt: timestamp("completedAt"),
  },
  table => [uniqueIndex("quest_progress_child_period_uq").on(table.childId, table.questKey, table.periodKey)],
);

export const achievements = mysqlTable("achievements", {
  key: varchar("key", { length: 64 }).primaryKey(),
  titleKey: varchar("titleKey", { length: 128 }).notNull(),
  descriptionKey: varchar("descriptionKey", { length: 128 }).notNull(),
  iconKey: varchar("iconKey", { length: 32 }).notNull(),
});

export const childAchievements = mysqlTable(
  "child_achievements",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    childId: varchar("childId", { length: 36 }).notNull().references(() => childProfiles.id, { onDelete: "cascade" }),
    achievementKey: varchar("achievementKey", { length: 64 }).notNull().references(() => achievements.key, { onDelete: "cascade" }),
    unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("child_achievements_child_key_uq").on(table.childId, table.achievementKey)],
);

export const rewardTransactions = mysqlTable(
  "reward_transactions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    childId: varchar("childId", { length: 36 }).notNull().references(() => childProfiles.id, { onDelete: "cascade" }),
    kind: mysqlEnum("kind", ["xp", "coins"]).notNull(),
    amount: int("amount").notNull(),
    reasonKey: varchar("reasonKey", { length: 128 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("reward_transactions_child_idx").on(table.childId)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
