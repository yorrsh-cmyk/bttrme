import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import type {
  BlockCategory,
  BlockStatus,
  NotCompletedCause,
  PartOfDay,
} from "@/domain/blockTypes";

// Migration 001 (M1): user, session, login_attempt, events.
// Field list per phase_4_information_architecture.md Part D (authoritative).
// Later milestones append fields/tables via new migrations only.

export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  timezone: text("timezone").notNull(), // IANA, e.g. Asia/Jerusalem
  weekStartDay: text("week_start_day").$type<"sun" | "mon">().notNull().default("sun"),
  language: text("language").$type<"he" | "en">().notNull().default("he"),
  // Soft reference line for the weekly load signal (non-rest hours); added in
  // migration 002 for M2, tunable in settings (PRD 02 NFR). day_end_hour and
  // part-of-day windows (IA Part D) arrive with M3/M6 as they're needed.
  loadThresholdHours: integer("load_threshold_hours").notNull().default(20),
  // The hour (local, 0–23) from which the daily review is offered (IA Part D,
  // default 20). Added in migration 003 for M3; consumed by M4's review gate.
  // Note: day-end AUTO-CLOSE is at civil midnight, not this hour (PRD 03 §9).
  dayEndHour: integer("day_end_hour").notNull().default(20),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    // The id IS the HMAC-SHA256 of the opaque token — the raw token never
    // touches the database (PRD 01: stored hashed).
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("session_expires_at_idx").on(table.expiresAt)],
);

export const loginAttempt = pgTable(
  "login_attempt",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    success: boolean("success").notNull(),
  },
  (table) => [index("login_attempt_at_idx").on(table.at)],
);

// Append-only forever: no UPDATE or DELETE, enforced by convention and the
// static guard test (tests/events-append-only.test.ts). History lives here.
export const events = pgTable(
  "events",
  {
    id: bigint("id", { mode: "bigint" }).primaryKey().generatedAlwaysAsIdentity(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull().default({}),
  },
  (table) => [
    index("events_entity_idx").on(table.entityType, table.entityId),
    index("events_at_idx").on(table.at),
  ],
);

// ---------------------------------------------------------------------------
// Migration 002 (M2): block_template, week, weekly_goal, block.
// Field list per phase_4_information_architecture.md Part D + PRD 02 §7.
// Category/status are text (validated in the domain); durations in minutes.
// ---------------------------------------------------------------------------

// The slow-changing curated set of action kinds. Archived, never deleted.
export const blockTemplate = pgTable("block_template", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  category: text("category").$type<BlockCategory>().notNull(),
  defaultDurationMin: integer("default_duration_min").notNull(),
  expectedOutcome: text("expected_outcome").notNull(),
  firstAction: text("first_action").notNull(),
  notes: text("notes"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// The week is the unit of intention, identified by its start date (a Sunday).
export const week = pgTable("week", {
  id: uuid("id").primaryKey().defaultRandom(),
  startDate: date("start_date", { mode: "string" }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 0–3 goals per week; the UI offers exactly three positions. M4 adds
// carry-forward lineage (carried_from_goal_id, outcome) via a later migration.
export const weeklyGoal = pgTable(
  "weekly_goal",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    weekId: uuid("week_id")
      .notNull()
      .references(() => week.id),
    position: smallint("position").notNull(), // 1–3
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("weekly_goal_week_position_uq").on(table.weekId, table.position)],
);

// A block is an instance in a week's pool. Template fields are COPIED at
// creation (history is immutable — editing a template never rewrites a block).
// Migration 002 seeded the pool/removed fields; migration 003 (M3) adds the
// scheduling + execution-state fields below. Moves/defers update scheduled_date
// / part_of_day WITHOUT changing status (IA Part E) — the change lives in the
// event log (block_moved), never overwriting history.
export const block = pgTable(
  "block",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    weekId: uuid("week_id")
      .notNull()
      .references(() => week.id),
    templateId: uuid("template_id").references(() => blockTemplate.id),
    // The optional "why this day" link (PRD 03 §7): the week goal this block
    // serves, picked at scheduling time and used only to show context.
    goalId: uuid("goal_id").references(() => weeklyGoal.id),
    name: text("name").notNull(),
    category: text("category").$type<BlockCategory>().notNull(),
    durationMin: integer("duration_min").notNull(),
    expectedOutcome: text("expected_outcome").notNull(),
    firstAction: text("first_action").notNull(),
    notes: text("notes"),
    status: text("status").$type<BlockStatus>().notNull().default("pool"),
    // Scheduling (nullable while in the pool). start_time is a civil wall-clock
    // "HH:MM" (optional); part_of_day is the default granularity. day_order is
    // the within-part ordering (FR-2).
    scheduledDate: date("scheduled_date", { mode: "string" }),
    partOfDay: text("part_of_day").$type<PartOfDay>(),
    startTime: text("start_time"), // "HH:MM", nullable
    dayOrder: integer("day_order"),
    // Execution facts, recorded as the block moves through the machine.
    actualStartAt: timestamp("actual_start_at", { withTimezone: true }),
    actualEndAt: timestamp("actual_end_at", { withTimezone: true }),
    notCompletedCause: text("not_completed_cause").$type<NotCompletedCause>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("block_week_idx").on(table.weekId),
    // The Today / day / recovery queries all filter by scheduled_date.
    index("block_scheduled_date_idx").on(table.scheduledDate),
  ],
);
