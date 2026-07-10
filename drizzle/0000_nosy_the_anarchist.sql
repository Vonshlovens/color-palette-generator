CREATE TABLE `palettes` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`hue` real NOT NULL,
	`saturation` real NOT NULL,
	`lightness` real NOT NULL,
	`harmony` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "palettes_slug_length_check" CHECK(length("palettes"."slug") between 8 and 32),
	CONSTRAINT "palettes_name_length_check" CHECK(length(trim("palettes"."name")) between 1 and 80),
	CONSTRAINT "palettes_hue_check" CHECK("palettes"."hue" between 0 and 360),
	CONSTRAINT "palettes_saturation_check" CHECK("palettes"."saturation" between 0 and 100),
	CONSTRAINT "palettes_lightness_check" CHECK("palettes"."lightness" between 0 and 100),
	CONSTRAINT "palettes_harmony_check" CHECK("palettes"."harmony" in ('complementary', 'analogous', 'triadic', 'split-complementary', 'tetradic', 'monochromatic'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `palettes_slug_unique` ON `palettes` (`slug`);--> statement-breakpoint
CREATE INDEX `palettes_created_at_idx` ON `palettes` (`created_at`);