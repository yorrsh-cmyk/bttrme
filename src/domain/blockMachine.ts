// The one real state machine (IA Part E / PRD 03 §5). Pure — no I/O, no DB, no
// framework (the src/domain rule). Given a block's current snapshot and a
// trigger, `transition` returns either a rejection or the exact field patch to
// apply PLUS the event to append. The server layer does the writing; every
// behavioural rule the product promises lives and is unit-tested here.
//
// The product's spine runs through this file: a miss is a neutral recorded
// transition (`not_completed`), never a debt; "stopped early" is a valid
// completion; moves/defers are NOT status changes (they update date/part_of_day
// while status stays `scheduled`); auto-close is silent. No judgment lives in
// the state names or the events (binding constraint 3, PRD 03 FR-6).

import type {
  BlockStatus,
  MoveReason,
  NotCompletedCause,
  PartOfDay,
} from "./blockTypes";
import { PARTS_OF_DAY } from "./blockTypes";
import type { CivilDate } from "./weekCycle";
import { hourInTimeZone, todayInTimeZone } from "./weekCycle";

// The event vocabulary the machine can emit (values match src/db/events.ts EVENT).
export type BlockEventType =
  | "block_scheduled"
  | "block_moved"
  | "block_started"
  | "block_completed"
  | "block_not_completed"
  | "block_removed";

export interface BlockEvent {
  eventType: BlockEventType;
  payload: Record<string, unknown>;
}

// The fields the machine reads and writes. A superset of the DB row's mutable
// state; the server passes the current row and applies the returned patch.
export interface BlockSnapshot {
  status: BlockStatus;
  scheduledDate: CivilDate | null;
  partOfDay: PartOfDay | null;
  startTime: string | null;
  dayOrder: number | null;
  goalId: string | null;
  actualStartAt: Date | null;
  actualEndAt: Date | null;
  notCompletedCause: NotCompletedCause | null;
  durationMin: number;
}

export type Trigger =
  // Pool → scheduled: place a block onto a day + part (start time optional).
  | {
      kind: "schedule";
      date: CivilDate;
      partOfDay: PartOfDay;
      startTime?: string | null;
      dayOrder?: number | null;
      goalId?: string | null;
    }
  // Move/defer: stays scheduled, updates date/part (PRD 03 FR-3). A defer to
  // later today is just a move to the same date with reason deferred_in_moment.
  // dayOrder places the block within the target slot's order (FR-2) — pass the
  // slot's next order so a moved block never collides with one already there.
  | {
      kind: "move";
      date: CivilDate;
      partOfDay: PartOfDay;
      startTime?: string | null;
      dayOrder?: number | null;
      reason: MoveReason;
    }
  // Unschedule: scheduled → pool (logged as a move back to the pool).
  | { kind: "returnToPool"; reason: MoveReason }
  | { kind: "start"; at: Date }
  | { kind: "complete"; at: Date } // → done
  | { kind: "stopEarly"; at: Date } // → done_partial (a completion, not a failure)
  | { kind: "skip" } // → not_completed, cause chosen
  | { kind: "autoClose" } // → not_completed, cause auto (silent, day-end)
  | { kind: "undoSkip" } // not_completed(chosen) → scheduled (the one-tap undo)
  | { kind: "remove" }; // any pre-active → removed

// Context for the time-guarded triggers (schedule/move): the user's civil
// "today", so we can refuse scheduling into the past (FR-4). Optional — omit it
// and the past-date guard is skipped (used by tests that don't exercise it).
export interface TransitionContext {
  today?: CivilDate;
}

export type RejectionReason = "illegal_transition" | "past_date";

export type TransitionResult =
  | { ok: true; patch: Partial<BlockSnapshot>; event: BlockEvent }
  | { ok: false; reason: RejectionReason };

function reject(reason: RejectionReason): TransitionResult {
  return { ok: false, reason };
}

/**
 * The whole state machine. Returns the patch + event for a legal transition, or
 * a typed rejection. Never throws on an illegal transition — an illegal move is
 * data, handled by the caller, not an exception.
 */
export function transition(
  block: BlockSnapshot,
  trigger: Trigger,
  ctx: TransitionContext = {},
): TransitionResult {
  switch (trigger.kind) {
    case "schedule": {
      if (block.status !== "pool") return reject("illegal_transition");
      if (ctx.today && trigger.date < ctx.today) return reject("past_date");
      return {
        ok: true,
        patch: {
          status: "scheduled",
          scheduledDate: trigger.date,
          partOfDay: trigger.partOfDay,
          startTime: trigger.startTime ?? null,
          dayOrder: trigger.dayOrder ?? null,
          ...(trigger.goalId !== undefined ? { goalId: trigger.goalId } : {}),
        },
        event: {
          eventType: "block_scheduled",
          payload: {
            date: trigger.date,
            partOfDay: trigger.partOfDay,
            startTime: trigger.startTime ?? null,
            goalId: trigger.goalId ?? block.goalId ?? null,
          },
        },
      };
    }

    case "move": {
      if (block.status !== "scheduled") return reject("illegal_transition");
      if (ctx.today && trigger.date < ctx.today) return reject("past_date");
      return {
        ok: true,
        // Status intentionally NOT in the patch: a move is not a state change.
        patch: {
          scheduledDate: trigger.date,
          partOfDay: trigger.partOfDay,
          ...(trigger.startTime !== undefined ? { startTime: trigger.startTime } : {}),
          ...(trigger.dayOrder !== undefined ? { dayOrder: trigger.dayOrder } : {}),
        },
        event: {
          eventType: "block_moved",
          payload: {
            from: { date: block.scheduledDate, partOfDay: block.partOfDay },
            to: { date: trigger.date, partOfDay: trigger.partOfDay },
            reason: trigger.reason,
          },
        },
      };
    }

    case "returnToPool": {
      if (block.status !== "scheduled") return reject("illegal_transition");
      return {
        ok: true,
        patch: {
          status: "pool",
          scheduledDate: null,
          partOfDay: null,
          startTime: null,
          dayOrder: null,
        },
        event: {
          eventType: "block_moved",
          payload: {
            from: { date: block.scheduledDate, partOfDay: block.partOfDay },
            to: "pool",
            reason: trigger.reason,
          },
        },
      };
    }

    case "start": {
      if (block.status !== "scheduled") return reject("illegal_transition");
      return {
        ok: true,
        patch: { status: "active", actualStartAt: trigger.at },
        event: { eventType: "block_started", payload: {} },
      };
    }

    case "complete": {
      if (block.status !== "active") return reject("illegal_transition");
      return {
        ok: true,
        patch: { status: "done", actualEndAt: trigger.at },
        event: { eventType: "block_completed", payload: { result: "full" } },
      };
    }

    case "stopEarly": {
      if (block.status !== "active") return reject("illegal_transition");
      return {
        ok: true,
        patch: { status: "done_partial", actualEndAt: trigger.at },
        event: { eventType: "block_completed", payload: { result: "partial" } },
      };
    }

    case "skip": {
      if (block.status !== "scheduled") return reject("illegal_transition");
      return {
        ok: true,
        patch: { status: "not_completed", notCompletedCause: "chosen" },
        event: { eventType: "block_not_completed", payload: { cause: "chosen" } },
      };
    }

    case "autoClose": {
      // Only a still-scheduled block auto-closes. An `active` block left open is
      // handled by the stale-active prompt (FR-7), never auto-failed.
      if (block.status !== "scheduled") return reject("illegal_transition");
      return {
        ok: true,
        patch: { status: "not_completed", notCompletedCause: "auto" },
        event: { eventType: "block_not_completed", payload: { cause: "auto" } },
      };
    }

    case "undoSkip": {
      // The one-tap undo (binding constraint 6). Only a *chosen* skip can be
      // undone; an auto-close is silent and has no undo affordance. Re-emitting
      // block_scheduled keeps "latest event wins" derivation honest: as of now,
      // the block is once again scheduled to its slot.
      if (block.status !== "not_completed" || block.notCompletedCause !== "chosen") {
        return reject("illegal_transition");
      }
      return {
        ok: true,
        patch: { status: "scheduled", notCompletedCause: null },
        event: {
          eventType: "block_scheduled",
          payload: {
            date: block.scheduledDate,
            partOfDay: block.partOfDay,
            startTime: block.startTime,
            goalId: block.goalId,
            undo: true,
          },
        },
      };
    }

    case "remove": {
      // Any pre-active state can be removed (hidden, never deleted).
      if (block.status !== "pool" && block.status !== "scheduled") {
        return reject("illegal_transition");
      }
      return {
        ok: true,
        patch: { status: "removed" },
        event: { eventType: "block_removed", payload: {} },
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Time-of-day helpers (pure). Part-of-day boundaries are fixed constants here;
// M6 makes them user-configurable window bounds (plan §3, migration 006).
// ---------------------------------------------------------------------------

/** Default local-hour boundaries: morning < 12:00 ≤ afternoon < 17:00 ≤ evening. */
export const PART_OF_DAY_START_HOUR: Record<PartOfDay, number> = {
  morning: 0,
  afternoon: 12,
  evening: 17,
};

/** Ordering index of a part of day (morning 0, afternoon 1, evening 2). */
export function partOfDayIndex(part: PartOfDay): number {
  return PARTS_OF_DAY.indexOf(part);
}

/** Which part of day it is now, in the user's timezone. */
export function currentPartOfDay(now: Date, timeZone: string): PartOfDay {
  const hour = hourInTimeZone(now, timeZone);
  if (hour < PART_OF_DAY_START_HOUR.afternoon) return "morning";
  if (hour < PART_OF_DAY_START_HOUR.evening) return "afternoon";
  return "evening";
}

/** FR-4: scheduling to a past civil date is impossible; today or later is fine. */
export function isSchedulableDate(date: CivilDate, today: CivilDate): boolean {
  return date >= today;
}

/**
 * The scheduled blocks whose day has already ended and so should auto-close to
 * not_completed(auto). The boundary is the user's civil midnight (PRD 03 §9),
 * read via civil dates, so DST (a 23h/25h day) never mis-fires. Generic over any
 * row shape carrying status + scheduledDate.
 */
export function blocksToAutoClose<
  T extends { status: BlockStatus; scheduledDate: CivilDate | null },
>(blocks: readonly T[], now: Date, timeZone: string): T[] {
  const today = todayInTimeZone(now, timeZone);
  return blocks.filter(
    (b) => b.status === "scheduled" && b.scheduledDate !== null && b.scheduledDate < today,
  );
}

/** An `active` block open past this multiple of its planned duration is "stale". */
export const STALE_ACTIVE_MULTIPLE = 3;

/**
 * FR-7: has an `active` block been open past ~3× its planned duration? If so the
 * app asks a neutral "is this still going?" close-out next open, rather than
 * auto-failing it. Pure predicate over the snapshot + now.
 */
export function isStaleActive(
  block: Pick<BlockSnapshot, "status" | "actualStartAt" | "durationMin">,
  now: Date,
): boolean {
  if (block.status !== "active" || !block.actualStartAt) return false;
  const elapsedMs = now.getTime() - block.actualStartAt.getTime();
  return elapsedMs > STALE_ACTIVE_MULTIPLE * block.durationMin * 60_000;
}

/** Elapsed whole minutes since an active block started (never negative). */
export function elapsedMinutes(actualStartAt: Date, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - actualStartAt.getTime()) / 60_000));
}

// ---------------------------------------------------------------------------
// Today composition (pure): given today's blocks and "now", decide what the
// execution view foregrounds, what belongs to recovery, and what's upcoming.
// ---------------------------------------------------------------------------

type DayBlock = {
  status: BlockStatus;
  partOfDay: PartOfDay | null;
  startTime: string | null;
  dayOrder: number | null;
};

/** Stable order for a day's scheduled blocks: part, then dayOrder, then time. */
export function sortDayBlocks<T extends DayBlock>(blocks: readonly T[]): T[] {
  const key = (b: T): [number, number, string] => [
    b.partOfDay ? partOfDayIndex(b.partOfDay) : 99,
    b.dayOrder ?? Number.MAX_SAFE_INTEGER,
    b.startTime ?? "99:99",
  ];
  return [...blocks].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    for (let i = 0; i < ka.length; i++) {
      if (ka[i]! < kb[i]!) return -1;
      if (ka[i]! > kb[i]!) return 1;
    }
    return 0;
  });
}

export interface DayView<T> {
  /** The single active block, if one is open (foregrounded with close-out). */
  active: T | null;
  /** Scheduled blocks in an earlier part than now → the recovery screen (FR-11). */
  passed: T[];
  /** The next scheduled block in the current or a later part → foregrounded. */
  current: T | null;
  /** Remaining scheduled blocks after `current`. */
  upcoming: T[];
}

/**
 * Split today's blocks for the execution view. Assumes past-day blocks have
 * already been auto-closed (so scheduled blocks here are all for today). An
 * active block always wins the foreground; otherwise the earliest current/later
 * scheduled block does, and earlier-part scheduled blocks go to recovery.
 */
export function composeDay<
  T extends DayBlock,
>(blocks: readonly T[], now: Date, timeZone: string): DayView<T> {
  const nowPart = partOfDayIndex(currentPartOfDay(now, timeZone));

  const active = blocks.find((b) => b.status === "active") ?? null;
  const scheduled = sortDayBlocks(blocks.filter((b) => b.status === "scheduled"));

  const passed: T[] = [];
  const currentOrLater: T[] = [];
  for (const b of scheduled) {
    const idx = b.partOfDay ? partOfDayIndex(b.partOfDay) : nowPart;
    if (idx < nowPart) passed.push(b);
    else currentOrLater.push(b);
  }

  // With an active block foregrounded, nothing else is "current" yet.
  const current = active ? null : (currentOrLater[0] ?? null);
  const upcoming = active ? currentOrLater : currentOrLater.slice(1);

  return { active, passed, current, upcoming };
}
