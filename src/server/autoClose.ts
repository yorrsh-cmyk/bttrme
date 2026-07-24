import "server-only";
import { ENTITY, EVENT, appendEvent } from "@/db/events";
import { blocksToAutoClose } from "@/domain/blockMachine";
import { todayInTimeZone, type CivilDate } from "@/domain/weekCycle";
import { applyTransition } from "@/server/blockOps";
import { listPastScheduledBlocks, type Block } from "@/server/queries";

// The day-end auto-close backstop (PRD 03 §5 last bullet, §7). A block scheduled
// for a day that has ended (past the user's civil midnight, DST-safe) becomes
// not_completed(auto) — silent, surfaced only in the daily review (M4). This runs
// two ways, both idempotent: lazily on first app open after the boundary, and
// from the nightly Vercel cron backstop.

interface ClosedDay {
  date: CivilDate;
  count: number;
}

/** Close every still-scheduled block whose civil day has passed. Idempotent. */
async function closePastScheduled(now: Date, timeZone: string): Promise<ClosedDay[]> {
  const today = todayInTimeZone(now, timeZone);
  const candidates = await listPastScheduledBlocks(today);
  // Re-confirm the boundary in the pure domain (the query is just a pre-filter).
  const toClose = blocksToAutoClose(candidates, now, timeZone);

  const byDay = new Map<CivilDate, number>();
  for (const row of toClose) {
    const result = await applyTransition(row.id, { kind: "autoClose" }, {}, row);
    if (result.ok && row.scheduledDate) {
      byDay.set(row.scheduledDate, (byDay.get(row.scheduledDate) ?? 0) + 1);
    }
  }

  return [...byDay.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

/**
 * Silent day-boundary auto-close. Appends one `day_auto_closed` marker per day
 * that had leftover blocks. Returns the total blocks closed. Safe to call on
 * every app open and from cron — a second run finds nothing scheduled.
 */
export async function autoCloseElapsedDays(now: Date, timeZone: string): Promise<number> {
  const closed = await closePastScheduled(now, timeZone);
  for (const day of closed) {
    await appendEvent(ENTITY.day, day.date, EVENT.dayAutoClosed, { count: day.count });
  }
  return closed.reduce((n, d) => n + d.count, 0);
}

/**
 * The multi-day-absence bulk archive (FR-12): the same neutral auto-close, plus
 * one `absence_archived` marker spanning the range, so the daily reviews still
 * read each day identically. Returns the affected days.
 */
export async function archiveAbsence(now: Date, timeZone: string): Promise<ClosedDay[]> {
  const closed = await closePastScheduled(now, timeZone);
  for (const day of closed) {
    await appendEvent(ENTITY.day, day.date, EVENT.dayAutoClosed, { count: day.count });
  }
  if (closed.length > 0) {
    const from = closed[0]!.date;
    const to = closed[closed.length - 1]!.date;
    const total = closed.reduce((n, d) => n + d.count, 0);
    await appendEvent(ENTITY.day, to, EVENT.absenceArchived, { from, to, count: total });
  }
  return closed;
}

/** Distinct past civil days that still hold scheduled blocks, as of `today`. */
export function distinctPastDays(blocks: readonly Pick<Block, "scheduledDate">[]): number {
  return new Set(blocks.map((b) => b.scheduledDate)).size;
}
