import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { ENTITY, appendEvent } from "@/db/events";
import { block } from "@/db/schema";
import {
  transition,
  type BlockSnapshot,
  type TransitionContext,
  type TransitionResult,
  type Trigger,
} from "@/domain/blockMachine";

// The single write path for the block state machine. Both the "use server"
// actions (execution.ts) and the auto-close backstop (autoClose.ts) go through
// applyTransition, so every status change is: pure decision (blockMachine) →
// DB patch → appended event. Nothing mutates a block outside this path except
// the M2 planning edits (name/fields) and the cosmetic day_order reorder.

export type BlockRow = typeof block.$inferSelect;

export function blockToSnapshot(row: BlockRow): BlockSnapshot {
  return {
    status: row.status,
    scheduledDate: row.scheduledDate,
    partOfDay: row.partOfDay,
    startTime: row.startTime,
    dayOrder: row.dayOrder,
    goalId: row.goalId,
    actualStartAt: row.actualStartAt,
    actualEndAt: row.actualEndAt,
    notCompletedCause: row.notCompletedCause,
    durationMin: row.durationMin,
  };
}

/**
 * Load a block, run the pure transition, and — only if it's legal — persist the
 * field patch and append the event. Returns the transition result so the caller
 * can react to an illegal move (an illegal transition is data, never an
 * exception). Given a pre-loaded row, pass it to skip the read.
 */
export async function applyTransition(
  blockId: string,
  trigger: Trigger,
  ctx: TransitionContext = {},
  preloaded?: BlockRow,
): Promise<TransitionResult> {
  let row = preloaded;
  if (!row) {
    [row] = await db.select().from(block).where(eq(block.id, blockId)).limit(1);
  }
  if (!row) return { ok: false, reason: "illegal_transition" };

  const result = transition(blockToSnapshot(row), trigger, ctx);
  if (!result.ok) return result;

  await db.update(block).set(result.patch).where(eq(block.id, blockId));
  await appendEvent(ENTITY.block, blockId, result.event.eventType, result.event.payload);
  return result;
}
