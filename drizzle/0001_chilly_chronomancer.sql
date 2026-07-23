CREATE TABLE "block" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_id" uuid NOT NULL,
	"template_id" uuid,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"duration_min" integer NOT NULL,
	"expected_outcome" text NOT NULL,
	"first_action" text NOT NULL,
	"notes" text,
	"status" text DEFAULT 'pool' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "block_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"default_duration_min" integer NOT NULL,
	"expected_outcome" text NOT NULL,
	"first_action" text NOT NULL,
	"notes" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "week" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"start_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "week_start_date_unique" UNIQUE("start_date")
);
--> statement-breakpoint
CREATE TABLE "weekly_goal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weekly_goal_week_position_uq" UNIQUE("week_id","position")
);
--> statement-breakpoint
ALTER TABLE "block" ADD CONSTRAINT "block_week_id_week_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."week"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block" ADD CONSTRAINT "block_template_id_block_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."block_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_goal" ADD CONSTRAINT "weekly_goal_week_id_week_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."week"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "block_week_idx" ON "block" USING btree ("week_id");