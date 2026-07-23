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
import type { BlockCategory, BlockStatus } from "@/domain/blockTypes";

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
// M2 uses status pool|removed; migration 003 adds the scheduling/state fields.
export const block = pgTable(
  "block",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    weekId: uuid("week_id")
      .notNull()
      .references(() => week.id),
    templateId: uuid("template_id").references(() => blockTemplate.id),
    name: text("name").notNull(),
    category: text("category").$type<BlockCategory>().notNull(),
    durationMin: integer("duration_min").notNull(),
    expectedOutcome: text("expected_outcome").notNull(),
    firstAction: text("first_action").notNull(),
    notes: text("notes"),
    status: text("status").$type<BlockStatus>().notNull().default("pool"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("block_week_idx").on(table.weekId)],
);
