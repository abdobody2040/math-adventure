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
    deletedAt: timestamp("deletedAt"),
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

export const parentPreferences = mysqlTable(
  "parent_preferences",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    parentId: varchar("parentId", { length: 36 }).notNull().unique().references(() => parentProfiles.id, { onDelete: "cascade" }),
    weeklyReportEnabled: boolean("weeklyReportEnabled").default(true).notNull(),
    learningReminderEnabled: boolean("learningReminderEnabled").default(true).notNull(),
    dataExportAllowed: boolean("dataExportAllowed").default(true).notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("parent_preferences_parent_idx").on(table.parentId)],
);

export const inventoryItems = mysqlTable("inventory_items", {
  key: varchar("key", { length: 64 }).primaryKey(),
  titleKey: varchar("titleKey", { length: 128 }).notNull(),
  category: mysqlEnum("category", ["outfit", "accessory", "backpack", "effect", "pet"]).notNull(),
  costCoins: int("costCoins").default(0).notNull(),
  assetKey: varchar("assetKey", { length: 64 }).notNull(),
  isPublished: boolean("isPublished").default(true).notNull(),
});

export const childInventory = mysqlTable(
  "child_inventory",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    childId: varchar("childId", { length: 36 }).notNull().references(() => childProfiles.id, { onDelete: "cascade" }),
    itemKey: varchar("itemKey", { length: 64 }).notNull().references(() => inventoryItems.key, { onDelete: "cascade" }),
    equipped: boolean("equipped").default(false).notNull(),
    acquiredAt: timestamp("acquiredAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("child_inventory_child_item_uq").on(table.childId, table.itemKey), index("child_inventory_child_idx").on(table.childId)],
);

export const pets = mysqlTable("pets", {
  key: varchar("key", { length: 64 }).primaryKey(),
  titleKey: varchar("titleKey", { length: 128 }).notNull(),
  descriptionKey: varchar("descriptionKey", { length: 128 }).notNull(),
  assetKey: varchar("assetKey", { length: 64 }).notNull(),
  unlockCoins: int("unlockCoins").default(0).notNull(),
  isPublished: boolean("isPublished").default(true).notNull(),
});

export const childPets = mysqlTable(
  "child_pets",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    childId: varchar("childId", { length: 36 }).notNull().references(() => childProfiles.id, { onDelete: "cascade" }),
    petKey: varchar("petKey", { length: 64 }).notNull().references(() => pets.key, { onDelete: "cascade" }),
    displayName: varchar("displayName", { length: 32 }),
    level: int("level").default(1).notNull(),
    equipped: boolean("equipped").default(false).notNull(),
    unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("child_pets_child_pet_uq").on(table.childId, table.petKey), index("child_pets_child_idx").on(table.childId)],
);

export const bossDefinitions = mysqlTable("boss_definitions", {
  worldKey: varchar("worldKey", { length: 64 }).primaryKey().references(() => worlds.key, { onDelete: "cascade" }),
  titleKey: varchar("titleKey", { length: 128 }).notNull(),
  health: int("health").default(100).notNull(),
  rewardXp: int("rewardXp").default(60).notNull(),
  rewardCoins: int("rewardCoins").default(25).notNull(),
  badgeKey: varchar("badgeKey", { length: 64 }),
});

export const bossAttempts = mysqlTable(
  "boss_attempts",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    childId: varchar("childId", { length: 36 }).notNull().references(() => childProfiles.id, { onDelete: "cascade" }),
    worldKey: varchar("worldKey", { length: 64 }).notNull().references(() => worlds.key, { onDelete: "cascade" }),
    healthRemaining: int("healthRemaining").notNull(),
    completedAt: timestamp("completedAt"),
    startedAt: timestamp("startedAt").defaultNow().notNull(),
  },
  table => [index("boss_attempts_child_world_idx").on(table.childId, table.worldKey)],
);

export const adaptiveRecommendations = mysqlTable(
  "adaptive_recommendations",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    childId: varchar("childId", { length: 36 }).notNull().references(() => childProfiles.id, { onDelete: "cascade" }),
    skillKey: varchar("skillKey", { length: 64 }).notNull().references(() => skills.key, { onDelete: "cascade" }),
    action: mysqlEnum("action", ["practice", "advance", "review", "remediate"]).notNull(),
    difficulty: int("difficulty").default(1).notNull(),
    reasonKey: varchar("reasonKey", { length: 128 }).notNull(),
    priority: int("priority").default(1).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    dismissedAt: timestamp("dismissedAt"),
  },
  table => [index("adaptive_recommendations_child_idx").on(table.childId, table.dismissedAt)],
);

export const adaptivePerformanceSnapshots = mysqlTable(
  "adaptive_performance_snapshots",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    childId: varchar("childId", { length: 36 }).notNull().references(() => childProfiles.id, { onDelete: "cascade" }),
    skillKey: varchar("skillKey", { length: 64 }).notNull().references(() => skills.key, { onDelete: "cascade" }),
    windowSize: int("windowSize").notNull(),
    correctRateBps: int("correctRateBps").notNull(),
    averageResponseTimeMs: int("averageResponseTimeMs").notNull(),
    usedHint: boolean("usedHint").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("adaptive_performance_child_skill_idx").on(table.childId, table.skillKey, table.createdAt)],
);

export const weeklyReports = mysqlTable(
  "weekly_reports",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    childId: varchar("childId", { length: 36 }).notNull().references(() => childProfiles.id, { onDelete: "cascade" }),
    weekKey: varchar("weekKey", { length: 10 }).notNull(),
    summary: json("summary").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("weekly_reports_child_week_uq").on(table.childId, table.weekKey)],
);

export const analyticsEvents = mysqlTable(
  "analytics_events",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    parentId: varchar("parentId", { length: 36 }).references(() => parentProfiles.id, { onDelete: "set null" }),
    childId: varchar("childId", { length: 36 }).references(() => childProfiles.id, { onDelete: "set null" }),
    eventKey: varchar("eventKey", { length: 64 }).notNull(),
    payload: json("payload"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("analytics_events_key_idx").on(table.eventKey, table.createdAt), index("analytics_events_child_idx").on(table.childId, table.createdAt)],
);

export const subscriptions = mysqlTable(
  "subscriptions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    parentId: varchar("parentId", { length: 36 }).notNull().references(() => parentProfiles.id, { onDelete: "cascade" }),
    plan: mysqlEnum("plan", ["free", "premium", "family"]).default("free").notNull(),
    status: mysqlEnum("status", ["active", "trialing", "past_due", "canceled"]).default("active").notNull(),
    providerCustomerId: varchar("providerCustomerId", { length: 128 }),
    providerSubscriptionId: varchar("providerSubscriptionId", { length: 128 }),
    currentPeriodEnd: timestamp("currentPeriodEnd"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("subscriptions_parent_uq").on(table.parentId)],
);

export const offlineSyncOperations = mysqlTable(
  "offline_sync_operations",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    childId: varchar("childId", { length: 36 }).notNull().references(() => childProfiles.id, { onDelete: "cascade" }),
    idempotencyKey: varchar("idempotencyKey", { length: 96 }).notNull(),
    operationType: varchar("operationType", { length: 64 }).notNull(),
    payload: json("payload").notNull(),
    processedAt: timestamp("processedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("offline_sync_child_idempotency_uq").on(table.childId, table.idempotencyKey), index("offline_sync_child_idx").on(table.childId, table.processedAt)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
