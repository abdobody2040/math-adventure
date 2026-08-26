CREATE TABLE `adaptive_performance_snapshots` (
	`id` varchar(36) NOT NULL,
	`childId` varchar(36) NOT NULL,
	`skillKey` varchar(64) NOT NULL,
	`windowSize` int NOT NULL,
	`correctRateBps` int NOT NULL,
	`averageResponseTimeMs` int NOT NULL,
	`usedHint` boolean NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adaptive_performance_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `adaptive_performance_snapshots` ADD CONSTRAINT `adaptive_performance_snapshots_childId_child_profiles_id_fk` FOREIGN KEY (`childId`) REFERENCES `child_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `adaptive_performance_snapshots` ADD CONSTRAINT `adaptive_performance_snapshots_skillKey_skills_key_fk` FOREIGN KEY (`skillKey`) REFERENCES `skills`(`key`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `adaptive_performance_child_skill_idx` ON `adaptive_performance_snapshots` (`childId`,`skillKey`,`createdAt`);