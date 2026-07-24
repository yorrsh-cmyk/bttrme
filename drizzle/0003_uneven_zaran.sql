ALTER TABLE "block" ADD COLUMN "goal_id" uuid;--> statement-breakpoint
ALTER TABLE "block" ADD COLUMN "scheduled_date" date;--> statement-breakpoint
ALTER TABLE "block" ADD COLUMN "part_of_day" text;--> statement-breakpoint
ALTER TABLE "block" ADD COLUMN "start_time" text;--> statement-breakpoint
ALTER TABLE "block" ADD COLUMN "day_order" integer;--> statement-breakpoint
ALTER TABLE "block" ADD COLUMN "actual_start_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "block" ADD COLUMN "actual_end_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "block" ADD COLUMN "not_completed_cause" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "day_end_hour" integer DEFAULT 20 NOT NULL;--> statement-breakpoint
ALTER TABLE "block" ADD CONSTRAINT "block_goal_id_weekly_goal_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."weekly_goal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "block_scheduled_date_idx" ON "block" USING btree ("scheduled_date");