import "server-only";
import { and, asc, eq, isNull, lt, notInArray } from "drizzle-orm";
import { db } from "@/db/client";
import { ENTITY, EVENT, appendEvent } from "@/db/events";
import { block, blockTemplate, week, weeklyGoal } from "@/db/schema";
import type { BlockStatus, PartOfDay } from "@/domain/blockTypes";
import type { CivilDate, WeekStartDay } from "@/domain/weekCycle";
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
 * Template ids referenced by at least one block (ever). These carry history,
 * so they can be archived but not hard-deleted (PRD 02 §3). Templates absent
 * from this set are unused and safe to delete.
 */
export async function listUsedTemplateIds(): Promise<Set<string>> {
  const rows = await db
    .selectDistinct({ templateId: block.templateId })
    .from(block);
  return new Set(rows.map((r) => r.templateId).filter((id): id is string => id !== null));
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

// --- M3: scheduling, execution, recovery -----------------------------------

/** A single block by id, or undefined. */
export async function getBlock(id: string): Promise<Block | undefined> {
  const [row] = await db.select().from(block).where(eq(block.id, id)).limit(1);
  return row;
}

// The statuses that appear on a day: everything except the pool (not yet placed)
// and removed (hidden). Terminal blocks stay visible so the day reads as history.
const DAY_STATUSES_HIDDEN: BlockStatus[] = ["pool", "removed"];

/** Every block placed on a given civil date (any live status), ordered. */
export function listDayBlocks(date: CivilDate): Promise<Block[]> {
  return db
    .select()
    .from(block)
    .where(and(eq(block.scheduledDate, date), notInArray(block.status, DAY_STATUSES_HIDDEN)))
    .orderBy(asc(block.dayOrder), asc(block.startTime), asc(block.createdAt));
}

/**
 * Still-`scheduled` blocks whose civil day is strictly before `today` — the
 * auto-close / absence-archive candidates. The domain (blocksToAutoClose)
 * re-confirms the boundary; this is the efficient DB pre-filter.
 */
export function listPastScheduledBlocks(today: CivilDate): Promise<Block[]> {
  return db
    .select()
    .from(block)
    .where(and(eq(block.status, "scheduled"), lt(block.scheduledDate, today)))
    .orderBy(asc(block.scheduledDate), asc(block.dayOrder));
}

/** The currently-active block, if any (there is at most one — the UI enforces it). */
export async function getActiveBlock(): Promise<Block | undefined> {
  const [row] = await db.select().from(block).where(eq(block.status, "active")).limit(1);
  return row;
}

/**
 * The next day_order for a (date, part_of_day) slot — appended after any block
 * already live there. Used when placing a pool block onto the day (FR-2).
 */
export async function nextDayOrder(date: CivilDate, partOfDay: PartOfDay): Promise<number> {
  const rows = await db
    .select({ dayOrder: block.dayOrder })
    .from(block)
    .where(
      and(
        eq(block.scheduledDate, date),
        eq(block.partOfDay, partOfDay),
        notInArray(block.status, DAY_STATUSES_HIDDEN),
      ),
    );
  const max = rows.reduce((m, r) => Math.max(m, r.dayOrder ?? -1), -1);
  return max + 1;
}
