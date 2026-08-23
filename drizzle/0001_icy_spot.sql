CREATE TABLE `achievements` (
	`key` varchar(64) NOT NULL,
	`titleKey` varchar(128) NOT NULL,
	`descriptionKey` varchar(128) NOT NULL,
	`iconKey` varchar(32) NOT NULL,
	CONSTRAINT `achievements_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `child_achievements` (
	`id` varchar(36) NOT NULL,
	`childId` varchar(36) NOT NULL,
	`achievementKey` varchar(64) NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `child_achievements_id` PRIMARY KEY(`id`),
	CONSTRAINT `child_achievements_child_key_uq` UNIQUE(`childId`,`achievementKey`)
);
--> statement-breakpoint
CREATE TABLE `child_profiles` (
	`id` varchar(36) NOT NULL,
	`parentId` varchar(36) NOT NULL,
	`displayName` varchar(32) NOT NULL,
	`age` int NOT NULL,
	`grade` varchar(32) NOT NULL,
	`avatarKey` varchar(64) NOT NULL DEFAULT 'starlight',
	`locale` enum('en','ar') NOT NULL DEFAULT 'en',
	`xp` int NOT NULL DEFAULT 0,
	`coins` int NOT NULL DEFAULT 0,
	`level` int NOT NULL DEFAULT 1,
	`streakDays` int NOT NULL DEFAULT 0,
	`lastPracticeAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `child_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` varchar(64) NOT NULL,
	`skillKey` varchar(64) NOT NULL,
	`titleKey` varchar(128) NOT NULL,
	`objectiveKey` varchar(128) NOT NULL,
	`estimatedMinutes` int NOT NULL DEFAULT 6,
	`sortOrder` int NOT NULL,
	CONSTRAINT `lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parent_profiles` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parent_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `parent_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `quest_progress` (
	`id` varchar(36) NOT NULL,
	`childId` varchar(36) NOT NULL,
	`questKey` varchar(64) NOT NULL,
	`periodKey` varchar(10) NOT NULL,
	`progress` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	CONSTRAINT `quest_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `quest_progress_child_period_uq` UNIQUE(`childId`,`questKey`,`periodKey`)
);
--> statement-breakpoint
CREATE TABLE `question_attempts` (
	`id` varchar(36) NOT NULL,
	`childId` varchar(36) NOT NULL,
	`sessionId` varchar(36) NOT NULL,
	`skillKey` varchar(64) NOT NULL,
	`submittedAnswer` varchar(32) NOT NULL,
	`isCorrect` boolean NOT NULL,
	`responseTimeMs` int NOT NULL,
	`usedHint` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `question_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `question_sessions` (
	`id` varchar(36) NOT NULL,
	`childId` varchar(36) NOT NULL,
	`skillKey` varchar(64) NOT NULL,
	`questionData` json NOT NULL,
	`correctAnswer` varchar(32) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `question_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `question_templates` (
	`key` varchar(64) NOT NULL,
	`skillKey` varchar(64) NOT NULL,
	`kind` varchar(64) NOT NULL,
	`difficulty` int NOT NULL DEFAULT 1,
	`isEnabled` boolean NOT NULL DEFAULT true,
	CONSTRAINT `question_templates_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `quests` (
	`key` varchar(64) NOT NULL,
	`titleKey` varchar(128) NOT NULL,
	`target` int NOT NULL,
	`rewardXp` int NOT NULL,
	`rewardCoins` int NOT NULL,
	`isDaily` boolean NOT NULL DEFAULT true,
	CONSTRAINT `quests_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `reward_transactions` (
	`id` varchar(36) NOT NULL,
	`childId` varchar(36) NOT NULL,
	`kind` enum('xp','coins') NOT NULL,
	`amount` int NOT NULL,
	`reasonKey` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reward_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skill_progress` (
	`id` varchar(36) NOT NULL,
	`childId` varchar(36) NOT NULL,
	`skillKey` varchar(64) NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`correctAnswers` int NOT NULL DEFAULT 0,
	`mastery` int NOT NULL DEFAULT 0,
	`lastPracticedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skill_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `skill_progress_child_skill_uq` UNIQUE(`childId`,`skillKey`)
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`key` varchar(64) NOT NULL,
	`worldKey` varchar(64) NOT NULL,
	`sortOrder` int NOT NULL,
	`nameKey` varchar(128) NOT NULL,
	`generatorKey` varchar(64) NOT NULL,
	`isPublished` boolean NOT NULL DEFAULT true,
	CONSTRAINT `skills_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `world_progress` (
	`id` varchar(36) NOT NULL,
	`childId` varchar(36) NOT NULL,
	`worldKey` varchar(64) NOT NULL,
	`isUnlocked` boolean NOT NULL DEFAULT false,
	`stars` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `world_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `world_progress_child_world_uq` UNIQUE(`childId`,`worldKey`)
);
--> statement-breakpoint
CREATE TABLE `worlds` (
	`key` varchar(64) NOT NULL,
	`sortOrder` int NOT NULL,
	`nameKey` varchar(128) NOT NULL,
	`descriptionKey` varchar(128) NOT NULL,
	`accent` varchar(32) NOT NULL,
	`iconKey` varchar(32) NOT NULL,
	`isPublished` boolean NOT NULL DEFAULT true,
	CONSTRAINT `worlds_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
ALTER TABLE `child_achievements` ADD CONSTRAINT `child_achievements_childId_child_profiles_id_fk` FOREIGN KEY (`childId`) REFERENCES `child_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `child_achievements` ADD CONSTRAINT `child_achievements_achievementKey_achievements_key_fk` FOREIGN KEY (`achievementKey`) REFERENCES `achievements`(`key`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `child_profiles` ADD CONSTRAINT `child_profiles_parentId_parent_profiles_id_fk` FOREIGN KEY (`parentId`) REFERENCES `parent_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lessons` ADD CONSTRAINT `lessons_skillKey_skills_key_fk` FOREIGN KEY (`skillKey`) REFERENCES `skills`(`key`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parent_profiles` ADD CONSTRAINT `parent_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quest_progress` ADD CONSTRAINT `quest_progress_childId_child_profiles_id_fk` FOREIGN KEY (`childId`) REFERENCES `child_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quest_progress` ADD CONSTRAINT `quest_progress_questKey_quests_key_fk` FOREIGN KEY (`questKey`) REFERENCES `quests`(`key`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `question_attempts` ADD CONSTRAINT `question_attempts_childId_child_profiles_id_fk` FOREIGN KEY (`childId`) REFERENCES `child_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `question_attempts` ADD CONSTRAINT `question_attempts_sessionId_question_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `question_sessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `question_attempts` ADD CONSTRAINT `question_attempts_skillKey_skills_key_fk` FOREIGN KEY (`skillKey`) REFERENCES `skills`(`key`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `question_sessions` ADD CONSTRAINT `question_sessions_childId_child_profiles_id_fk` FOREIGN KEY (`childId`) REFERENCES `child_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `question_sessions` ADD CONSTRAINT `question_sessions_skillKey_skills_key_fk` FOREIGN KEY (`skillKey`) REFERENCES `skills`(`key`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `question_templates` ADD CONSTRAINT `question_templates_skillKey_skills_key_fk` FOREIGN KEY (`skillKey`) REFERENCES `skills`(`key`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reward_transactions` ADD CONSTRAINT `reward_transactions_childId_child_profiles_id_fk` FOREIGN KEY (`childId`) REFERENCES `child_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skill_progress` ADD CONSTRAINT `skill_progress_childId_child_profiles_id_fk` FOREIGN KEY (`childId`) REFERENCES `child_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skill_progress` ADD CONSTRAINT `skill_progress_skillKey_skills_key_fk` FOREIGN KEY (`skillKey`) REFERENCES `skills`(`key`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skills` ADD CONSTRAINT `skills_worldKey_worlds_key_fk` FOREIGN KEY (`worldKey`) REFERENCES `worlds`(`key`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `world_progress` ADD CONSTRAINT `world_progress_childId_child_profiles_id_fk` FOREIGN KEY (`childId`) REFERENCES `child_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `world_progress` ADD CONSTRAINT `world_progress_worldKey_worlds_key_fk` FOREIGN KEY (`worldKey`) REFERENCES `worlds`(`key`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `child_profiles_parent_idx` ON `child_profiles` (`parentId`);--> statement-breakpoint
CREATE INDEX `lessons_skill_idx` ON `lessons` (`skillKey`);--> statement-breakpoint
CREATE INDEX `parent_profiles_user_idx` ON `parent_profiles` (`userId`);--> statement-breakpoint
CREATE INDEX `question_attempts_child_idx` ON `question_attempts` (`childId`);--> statement-breakpoint
CREATE INDEX `question_attempts_skill_idx` ON `question_attempts` (`childId`,`skillKey`);--> statement-breakpoint
CREATE INDEX `question_sessions_child_idx` ON `question_sessions` (`childId`);--> statement-breakpoint
CREATE INDEX `question_sessions_expiry_idx` ON `question_sessions` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `question_templates_skill_idx` ON `question_templates` (`skillKey`);--> statement-breakpoint
CREATE INDEX `reward_transactions_child_idx` ON `reward_transactions` (`childId`);--> statement-breakpoint
CREATE INDEX `skill_progress_child_idx` ON `skill_progress` (`childId`);--> statement-breakpoint
CREATE INDEX `skills_world_idx` ON `skills` (`worldKey`);