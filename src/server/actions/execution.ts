"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { block as blockTable } from "@/db/schema";
import { composeDay, type Trigger } from "@/domain/blockMachine";
import { isPartOfDay, type MoveReason, type PartOfDay } from "@/domain/blockTypes";
import { todayInTimeZone } from "@/domain/weekCycle";
import { archiveAbsence } from "@/server/autoClose";
import { applyTransition } from "@/server/blockOps";
import { getBlock, listDayBlocks, nextDayOrder } from "@/server/queries";
import { requireUser } from "@/server/session";

// The M3 execution surface. Every action is one honest tap for the user; the
// heavy lifting (which transitions are legal, what to record) lives in the pure
// blockMachine and is applied by applyTransition. No action costs more than the
// pretending it replaces — a miss is one tap (binding constraint 6).

// Revalidate the three places a block can be seen from. Cheap for one user.
function revalidateBlockViews(date?: string | null): void {
  revalidatePath("/");
  revalidatePath("/week");
  if (date) revalidatePath(`/day/${date}`);
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
function cleanStartTime(value: string | null | undefined): string | null {
  return value && HHMM.test(value) ? value : null;
}

// --- Scheduling (day view) ---------------------------------------------------

/** Place a pool block onto (date, part_of_day); start time + goal link optional. */
export async function scheduleBlock(
  blockId: string,
  date: string,
  partOfDayRaw: string,
  startTime: string | null = null,
  goalId: string | null = null,
): Promise<void> {
  const me = await requireUser();
  if (!blockId || !isPartOfDay(partOfDayRaw) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  const partOfDay: PartOfDay = partOfDayRaw;

  const dayOrder = await nextDayOrder(date, partOfDay);
  await applyTransition(
    blockId,
    {
      kind: "schedule",
      date,
      partOfDay,
      startTime: cleanStartTime(startTime),
      dayOrder,
      goalId: goalId || null,
    },
    { today: todayInTimeZone(new Date(), me.timezone) },
  );
  revalidateBlockViews(date);
}

/** Move a scheduled block to another day/part (planned move or in-moment defer). */
export async function moveBlock(
  blockId: string,
  date: string,
  partOfDayRaw: string,
  reason: MoveReason,
  startTime?: string | null,
): Promise<void> {
  const me = await requireUser();
  if (!blockId || !isPartOfDay(partOfDayRaw) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  const before = await getBlock(blockId);
  const dayOrder = await nextDayOrder(date, partOfDayRaw);
  const trigger: Trigger = {
    kind: "move",
    date,
    partOfDay: partOfDayRaw,
    reason,
    dayOrder,
    ...(startTime !== undefined ? { startTime: cleanStartTime(startTime) } : {}),
  };
  await applyTransition(blockId, trigger, { today: todayInTimeZone(new Date(), me.timezone) });
  revalidateBlockViews(date);
  if (before?.scheduledDate && before.scheduledDate !== date) {
    revalidatePath(`/day/${before.scheduledDate}`);
  }
}

/** Defer a scheduled block to a later part of the SAME day (the in-moment path). */
export async function deferBlock(blockId: string, partOfDayRaw: string): Promise<void> {
  await requireUser();
  if (!isPartOfDay(partOfDayRaw)) return;
  const block = await getBlock(blockId);
  if (!block?.scheduledDate) return;
  const dayOrder = await nextDayOrder(block.scheduledDate, partOfDayRaw);
  await applyTransition(blockId, {
    kind: "move",
    date: block.scheduledDate,
    partOfDay: partOfDayRaw,
    dayOrder,
    reason: "deferred_in_moment",
  });
  revalidateBlockViews(block.scheduledDate);
}

/** Send a scheduled block back to the week pool (unschedule). */
export async function returnBlockToPool(blockId: string): Promise<void> {
  await requireUser();
  const block = await getBlock(blockId);
  await applyTransition(blockId, { kind: "returnToPool", reason: "planned_move" });
  revalidateBlockViews(block?.scheduledDate);
}

/**
 * Swap two blocks' within-part order (the up/down reorder, FR-2). Cosmetic plan
 * state — no lifecycle event. Both must be scheduled to the same day + part.
 */
export async function swapBlockOrder(idA: string, idB: string): Promise<void> {
  await requireUser();
  const [a, b] = await Promise.all([getBlock(idA), getBlock(idB)]);
  if (!a || !b || a.status !== "scheduled" || b.status !== "scheduled") return;
  if (a.scheduledDate !== b.scheduledDate || a.partOfDay !== b.partOfDay) return;
  await db.update(blockTable).set({ dayOrder: b.dayOrder }).where(eq(blockTable.id, a.id));
  await db.update(blockTable).set({ dayOrder: a.dayOrder }).where(eq(blockTable.id, b.id));
  revalidateBlockViews(a.scheduledDate);
}

// --- Execution moment (four responses + close-out) ---------------------------

export async function startBlock(blockId: string): Promise<void> {
  await requireUser();
  const block = await getBlock(blockId);
  await applyTransition(blockId, { kind: "start", at: new Date() });
  revalidateBlockViews(block?.scheduledDate);
}

export async function completeBlock(blockId: string): Promise<void> {
  await requireUser();
  const block = await getBlock(blockId);
  await applyTransition(blockId, { kind: "complete", at: new Date() });
  revalidateBlockViews(block?.scheduledDate);
}

export async function stopEarlyBlock(blockId: string): Promise<void> {
  await requireUser();
  const block = await getBlock(blockId);
  await applyTransition(blockId, { kind: "stopEarly", at: new Date() });
  revalidateBlockViews(block?.scheduledDate);
}

export async function skipBlock(blockId: string): Promise<void> {
  await requireUser();
  const block = await getBlock(blockId);
  await applyTransition(blockId, { kind: "skip" });
  revalidateBlockViews(block?.scheduledDate);
}

/** The one-tap undo of a just-tapped Skip (cheaper honesty, no confirm dialog). */
export async function undoSkipBlock(blockId: string): Promise<void> {
  await requireUser();
  const block = await getBlock(blockId);
  await applyTransition(blockId, { kind: "undoSkip" });
  revalidateBlockViews(block?.scheduledDate);
}

// --- Recovery ----------------------------------------------------------------

/**
 * "Skip all for today" from the passed-window screen (FR-11): skip every one of
 * today's still-scheduled blocks whose part of day has already passed. One tap.
 */
export async function skipPassedToday(): Promise<void> {
  const me = await requireUser();
  const now = new Date();
  const today = todayInTimeZone(now, me.timezone);
  const dayBlocks = await listDayBlocks(today);
  const { passed } = composeDay(dayBlocks, now, me.timezone);
  for (const block of passed) {
    await applyTransition(block.id, { kind: "skip" });
  }
  revalidateBlockViews(today);
}

/**
 * "Archive missed days" from the absence screen (FR-12): bulk auto-close every
 * past day's leftover scheduled blocks, land on a clean today. Backfilling is
 * never requested.
 */
export async function archiveMissedDays(): Promise<void> {
  const me = await requireUser();
  await archiveAbsence(new Date(), me.timezone);
  revalidatePath("/");
  revalidatePath("/week");
}
