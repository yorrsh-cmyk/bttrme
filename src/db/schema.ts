import {
  bigint,
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

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
