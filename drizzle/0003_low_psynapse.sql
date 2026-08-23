CREATE TABLE `adaptive_recommendations` (
	`id` varchar(36) NOT NULL,
	`childId` varchar(36) NOT NULL,
	`skillKey` varchar(64) NOT NULL,
	`action` enum('practice','advance','review','remediate') NOT NULL,
	`difficulty` int NOT NULL DEFAULT 1,
	`reasonKey` varchar(128) NOT NULL,
	`priority` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`dismissedAt` timestamp,
	CONSTRAINT `adaptive_recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analytics_events` (
	`id` varchar(36) NOT NULL,
	`parentId` varchar(36),
	`childId` varchar(36),
	`eventKey` varchar(64) NOT NULL,
	`payload` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boss_attempts` (
	`id` varchar(36) NOT NULL,
	`childId` varchar(36) NOT NULL,
	`worldKey` varchar(64) NOT NULL,
	`healthRemaining` int NOT NULL,
	`completedAt` timestamp,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `boss_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boss_definitions` (
	`worldKey` varchar(64) NOT NULL,
	`titleKey` varchar(128) NOT NULL,
	`health` int NOT NULL DEFAULT 100,
	`rewardXp` int NOT NULL DEFAULT 60,
	`rewardCoins` int NOT NULL DEFAULT 25,
	`badgeKey` varchar(64),
	CONSTRAINT `boss_definitions_worldKey` PRIMARY KEY(`worldKey`)
);
--> statement-breakpoint
CREATE TABLE `child_inventory` (
	`id` varchar(36) NOT NULL,
	`childId` varchar(36) NOT NULL,
	`itemKey` varchar(64) NOT NULL,
	`equipped` boolean NOT NULL DEFAULT false,
	`acquiredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `child_inventory_id` PRIMARY KEY(`id`),
	CONSTRAINT `child_inventory_child_item_uq` UNIQUE(`childId`,`itemKey`)
);
--> statement-breakpoint
CREATE TABLE `child_pets` (
	`id` varchar(36) NOT NULL,
	`childId` varchar(36) NOT NULL,
	`petKey` varchar(64) NOT NULL,
	`displayName` varchar(32),
	`level` int NOT NULL DEFAULT 1,
	`equipped` boolean NOT NULL DEFAULT false,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `child_pets_id` PRIMARY KEY(`id`),
	CONSTRAINT `child_pets_child_pet_uq` UNIQUE(`childId`,`petKey`)
);
--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`key` varchar(64) NOT NULL,
	`titleKey` varchar(128) NOT NULL,
	`category` enum('outfit','accessory','backpack','effect','pet') NOT NULL,
	`costCoins` int NOT NULL DEFAULT 0,
	`assetKey` varchar(64) NOT NULL,
	`isPublished` boolean NOT NULL DEFAULT true,
	CONSTRAINT `inventory_items_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `offline_sync_operations` (
	`id` varchar(36) NOT NULL,
	`childId` varchar(36) NOT NULL,
	`idempotencyKey` varchar(96) NOT NULL,
	`operationType` varchar(64) NOT NULL,
	`payload` json NOT NULL,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `offline_sync_operations_id` PRIMARY KEY(`id`),
	CONSTRAINT `offline_sync_child_idempotency_uq` UNIQUE(`childId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `parent_preferences` (
	`id` varchar(36) NOT NULL,
	`parentId` varchar(36) NOT NULL,
	`weeklyReportEnabled` boolean NOT NULL DEFAULT true,
	`learningReminderEnabled` boolean NOT NULL DEFAULT true,
	`dataExportAllowed` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parent_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `parent_preferences_parentId_unique` UNIQUE(`parentId`)
);
--> statement-breakpoint
CREATE TABLE `pets` (
	`key` varchar(64) NOT NULL,
	`titleKey` varchar(128) NOT NULL,
	`descriptionKey` varchar(128) NOT NULL,
	`assetKey` varchar(64) NOT NULL,
	`unlockCoins` int NOT NULL DEFAULT 0,
	`isPublished` boolean NOT NULL DEFAULT true,
	CONSTRAINT `pets_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` varchar(36) NOT NULL,
	`parentId` varchar(36) NOT NULL,
	`plan` enum('free','premium','family') NOT NULL DEFAULT 'free',
	`status` enum('active','trialing','past_due','canceled') NOT NULL DEFAULT 'active',
	`providerCustomerId` varchar(128),
	`providerSubscriptionId` varchar(128),
	`currentPeriodEnd` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_parent_uq` UNIQUE(`parentId`)
);
--> statement-breakpoint
CREATE TABLE `weekly_reports` (
	`id` varchar(36) NOT NULL,
	`childId` varchar(36) NOT NULL,
	`weekKey` varchar(10) NOT NULL,
	`summary` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weekly_reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `weekly_reports_child_week_uq` UNIQUE(`childId`,`weekKey`)
);
--> statement-breakpoint
ALTER TABLE `child_profiles` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `adaptive_recommendations` ADD CONSTRAINT `adaptive_recommendations_childId_child_profiles_id_fk` FOREIGN KEY (`childId`) REFERENCES `child_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `adaptive_recommendations` ADD CONSTRAINT `adaptive_recommendations_skillKey_skills_key_fk` FOREIGN KEY (`skillKey`) REFERENCES `skills`(`key`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analytics_events` ADD CONSTRAINT `analytics_events_parentId_parent_profiles_id_fk` FOREIGN KEY (`parentId`) REFERENCES `parent_profiles`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analytics_events` ADD CONSTRAINT `analytics_events_childId_child_profiles_id_fk` FOREIGN KEY (`childId`) REFERENCES `child_profiles`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boss_attempts` ADD CONSTRAINT `boss_attempts_childId_child_profiles_id_fk` FOREIGN KEY (`childId`) REFERENCES `child_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boss_attempts` ADD CONSTRAINT `boss_attempts_worldKey_worlds_key_fk` FOREIGN KEY (`worldKey`) REFERENCES `worlds`(`key`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boss_definitions` ADD CONSTRAINT `boss_definitions_worldKey_worlds_key_fk` FOREIGN KEY (`worldKey`) REFERENCES `worlds`(`key`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `child_inventory` ADD CONSTRAINT `child_inventory_childId_child_profiles_id_fk` FOREIGN KEY (`childId`) REFERENCES `child_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `child_inventory` ADD CONSTRAINT `child_inventory_itemKey_inventory_items_key_fk` FOREIGN KEY (`itemKey`) REFERENCES `inventory_items`(`key`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `child_pets` ADD CONSTRAINT `child_pets_childId_child_profiles_id_fk` FOREIGN KEY (`childId`) REFERENCES `child_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `child_pets` ADD CONSTRAINT `child_pets_petKey_pets_key_fk` FOREIGN KEY (`petKey`) REFERENCES `pets`(`key`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offline_sync_operations` ADD CONSTRAINT `offline_sync_operations_childId_child_profiles_id_fk` FOREIGN KEY (`childId`) REFERENCES `child_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parent_preferences` ADD CONSTRAINT `parent_preferences_parentId_parent_profiles_id_fk` FOREIGN KEY (`parentId`) REFERENCES `parent_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_parentId_parent_profiles_id_fk` FOREIGN KEY (`parentId`) REFERENCES `parent_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `weekly_reports` ADD CONSTRAINT `weekly_reports_childId_child_profiles_id_fk` FOREIGN KEY (`childId`) REFERENCES `child_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `adaptive_recommendations_child_idx` ON `adaptive_recommendations` (`childId`,`dismissedAt`);--> statement-breakpoint
CREATE INDEX `analytics_events_key_idx` ON `analytics_events` (`eventKey`,`createdAt`);--> statement-breakpoint
CREATE INDEX `analytics_events_child_idx` ON `analytics_events` (`childId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `boss_attempts_child_world_idx` ON `boss_attempts` (`childId`,`worldKey`);--> statement-breakpoint
CREATE INDEX `child_inventory_child_idx` ON `child_inventory` (`childId`);--> statement-breakpoint
CREATE INDEX `child_pets_child_idx` ON `child_pets` (`childId`);--> statement-breakpoint
CREATE INDEX `offline_sync_child_idx` ON `offline_sync_operations` (`childId`,`processedAt`);--> statement-breakpoint
CREATE INDEX `parent_preferences_parent_idx` ON `parent_preferences` (`parentId`);