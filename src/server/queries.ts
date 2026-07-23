import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { ENTITY, EVENT, appendEvent } from "@/db/events";
import { block, blockTemplate, week, weeklyGoal } from "@/db/schema";
import type { WeekStartDay } from "@/domain/weekCycle";
import { weekStartForInstant } from "@/domain/weekCycle";

export type Template = typeof blockTemplate.$inferSelect;
export type Week = typeof week.$inferSelect;
export type Goal = typeof weeklyGoal.$inferSelect;
export type Block = typeof block.$inferSelect;

/** Active templates for the picker (archived hidden). */
export function listActiveTemplates(): Promise<Template[]> {
  return db
    .select()
    .from(blockTemplate)
    .where(isNull(blockTemplate.archivedAt))
    .orderBy(asc(blockTemplate.category), asc(blockTemplate.name));
}

/** All templates including archived — for the Library management view. */
export function listAllTemplates(): Promise<Template[]> {
  return db
    .select()
    .from(blockTemplate)
    .orderBy(asc(blockTemplate.category), asc(blockTemplate.name));
}

/**
 * The week row for `startDate`, materializing it on first touch (PRD 02 FR-3).
 * Idempotent: the unique start_date + onConflictDoNothing means concurrent
 * or repeated visits create exactly one row and emit exactly one week_created.
 */
export async function getOrCreateWeek(startDate: string): Promise<Week> {
  const inserted = await db
    .insert(week)
    .values({ startDate })
    .onConflictDoNothing({ target: week.startDate })
    .returning();

  if (inserted[0]) {
    await appendEvent(ENTITY.week, inserted[0].id, EVENT.weekCreated, { startDate });
    return inserted[0];
  }

  const existing = await db.select().from(week).where(eq(week.startDate, startDate)).limit(1);
  return existing[0]!;
}

export function currentWeekStartFor(
  now: Date,
  timezone: string,
  weekStartDay: WeekStartDay,
): string {
  return weekStartForInstant(now, timezone, weekStartDay);
}

/** Goals for a week, ordered by their slot (1–3). */
export function listGoals(weekId: string): Promise<Goal[]> {
  return db
    .select()
    .from(weeklyGoal)
    .where(eq(weeklyGoal.weekId, weekId))
    .orderBy(asc(weeklyGoal.position));
}

/** Pool blocks for a week (removed blocks hidden), grouped-friendly ordering. */
export function listPoolBlocks(weekId: string): Promise<Block[]> {
  return db
    .select()
    .from(block)
    .where(and(eq(block.weekId, weekId), eq(block.status, "pool")))
    .orderBy(asc(block.category), asc(block.createdAt));
}
