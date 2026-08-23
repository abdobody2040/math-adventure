CREATE TABLE `learning_sessions` (
	`id` varchar(36) NOT NULL,
	`childId` varchar(36) NOT NULL,
	`skillKey` varchar(64) NOT NULL,
	`mode` enum('lesson','battle') NOT NULL,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`durationSeconds` int NOT NULL DEFAULT 0,
	CONSTRAINT `learning_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `learning_sessions` ADD CONSTRAINT `learning_sessions_childId_child_profiles_id_fk` FOREIGN KEY (`childId`) REFERENCES `child_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learning_sessions` ADD CONSTRAINT `learning_sessions_skillKey_skills_key_fk` FOREIGN KEY (`skillKey`) REFERENCES `skills`(`key`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `learning_sessions_child_idx` ON `learning_sessions` (`childId`);--> statement-breakpoint
CREATE INDEX `learning_sessions_completed_idx` ON `learning_sessions` (`childId`,`completedAt`);