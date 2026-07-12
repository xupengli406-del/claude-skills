CREATE TABLE `registrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`organization` text DEFAULT '' NOT NULL,
	`role` text NOT NULL,
	`track` text NOT NULL,
	`team_name` text DEFAULT '' NOT NULL,
	`team_size` integer DEFAULT 1 NOT NULL,
	`project_idea` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `registrations_email_unique` ON `registrations` (`email`);