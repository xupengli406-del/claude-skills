CREATE TABLE `registration_sync` (
	`email` text PRIMARY KEY NOT NULL,
	`feishu_range` text DEFAULT '' NOT NULL,
	`last_error` text DEFAULT '' NOT NULL,
	`synced_at` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
