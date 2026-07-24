import { describe, expect, it } from "vitest";
import {
  blocksToAutoClose,
  composeDay,
  currentPartOfDay,
  elapsedMinutes,
  isSchedulableDate,
  isStaleActive,
  partOfDayIndex,
  sortDayBlocks,
  transition,
  type BlockSnapshot,
  type Trigger,
} from "@/domain/blockMachine";
import type { BlockStatus } from "@/domain/blockTypes";

const TZ = "Asia/Jerusalem";

// A block in the pool with all execution fields empty — the starting point.
function poolBlock(overrides: Partial<BlockSnapshot> = {}): BlockSnapshot {
  return {
    status: "pool",
    scheduledDate: null,
    partOfDay: null,
    startTime: null,
    dayOrder: null,
    goalId: null,
    actualStartAt: null,
    actualEndAt: null,
    notCompletedCause: null,
    durationMin: 30,
    ...overrides,
  };
}

function scheduled(overrides: Partial<BlockSnapshot> = {}): BlockSnapshot {
  return poolBlock({
    status: "scheduled",
    scheduledDate: "2026-07-24",
    partOfDay: "morning",
    ...overrides,
  });
}

// Assert a transition succeeded and return the successful result (typed).
function ok(result: ReturnType<typeof transition>) {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("expected ok");
  return result;
}

describe("transition — legal transitions", () => {
  it("schedule: pool → scheduled, records date/part/time, emits block_scheduled", () => {
    const r = ok(
      transition(poolBlock(), {
        kind: "schedule",
        date: "2026-07-24",
        partOfDay: "afternoon",
        startTime: "14:30",
        dayOrder: 0,
        goalId: "goal-1",
      }),
    );
    expect(r.patch).toMatchObject({
      status: "scheduled",
      scheduledDate: "2026-07-24",
      partOfDay: "afternoon",
      startTime: "14:30",
      dayOrder: 0,
      goalId: "goal-1",
    });
    expect(r.event.eventType).toBe("block_scheduled");
    expect(r.event.payload).toMatchObject({ date: "2026-07-24", partOfDay: "afternoon" });
  });

  it("schedule: start time is optional (defaults to null)", () => {
    const r = ok(
      transition(poolBlock(), { kind: "schedule", date: "2026-07-24", partOfDay: "morning" }),
    );
    expect(r.patch.startTime).toBeNull();
  });

  it("move: scheduled → scheduled (NOT a status change), emits block_moved with from/to", () => {
    const r = ok(
      transition(scheduled({ scheduledDate: "2026-07-24", partOfDay: "morning" }), {
        kind: "move",
        date: "2026-07-26",
        partOfDay: "evening",
        reason: "planned_move",
      }),
    );
    // Status must not appear in the patch — a move is not a state change.
    expect(r.patch.status).toBeUndefined();
    expect(r.patch).toMatchObject({ scheduledDate: "2026-07-26", partOfDay: "evening" });
    expect(r.event.eventType).toBe("block_moved");
    expect(r.event.payload).toMatchObject({
      from: { date: "2026-07-24", partOfDay: "morning" },
      to: { date: "2026-07-26", partOfDay: "evening" },
      reason: "planned_move",
    });
  });

  it("move: places the block at the target slot's order when dayOrder is given", () => {
    const r = ok(
      transition(scheduled(), {
        kind: "move",
        date: "2026-07-26",
        partOfDay: "evening",
        dayOrder: 3,
        reason: "planned_move",
      }),
    );
    expect(r.patch.dayOrder).toBe(3);
    // Still not a status change.
    expect(r.patch.status).toBeUndefined();
  });

  it("move (defer to later today): same date, later part, reason deferred_in_moment", () => {
    const r = ok(
      transition(scheduled({ partOfDay: "morning" }), {
        kind: "move",
        date: "2026-07-24",
        partOfDay: "evening",
        reason: "deferred_in_moment",
      }),
    );
    expect(r.event.payload).toMatchObject({ reason: "deferred_in_moment" });
    expect(r.patch.partOfDay).toBe("evening");
  });

  it("returnToPool: scheduled → pool, clears scheduling fields", () => {
    const r = ok(transition(scheduled(), { kind: "returnToPool", reason: "planned_move" }));
    expect(r.patch).toMatchObject({
      status: "pool",
      scheduledDate: null,
      partOfDay: null,
      startTime: null,
      dayOrder: null,
    });
    expect(r.event.payload).toMatchObject({ to: "pool" });
  });

  it("start: scheduled → active, records actual_start_at", () => {
    const at = new Date("2026-07-24T09:00:00Z");
    const r = ok(transition(scheduled(), { kind: "start", at }));
    expect(r.patch).toMatchObject({ status: "active", actualStartAt: at });
    expect(r.event.eventType).toBe("block_started");
  });

  it("complete: active → done, records actual_end_at, result full", () => {
    const at = new Date("2026-07-24T09:30:00Z");
    const r = ok(transition(scheduled({ status: "active" }), { kind: "complete", at }));
    expect(r.patch).toMatchObject({ status: "done", actualEndAt: at });
    expect(r.event).toMatchObject({ eventType: "block_completed", payload: { result: "full" } });
  });

  it("stopEarly: active → done_partial (a completion), result partial", () => {
    const at = new Date("2026-07-24T09:10:00Z");
    const r = ok(transition(scheduled({ status: "active" }), { kind: "stopEarly", at }));
    expect(r.patch).toMatchObject({ status: "done_partial", actualEndAt: at });
    expect(r.event).toMatchObject({ eventType: "block_completed", payload: { result: "partial" } });
  });

  it("skip: scheduled → not_completed, cause chosen", () => {
    const r = ok(transition(scheduled(), { kind: "skip" }));
    expect(r.patch).toMatchObject({ status: "not_completed", notCompletedCause: "chosen" });
    expect(r.event).toMatchObject({
      eventType: "block_not_completed",
      payload: { cause: "chosen" },
    });
  });

  it("autoClose: scheduled → not_completed, cause auto", () => {
    const r = ok(transition(scheduled(), { kind: "autoClose" }));
    expect(r.patch).toMatchObject({ status: "not_completed", notCompletedCause: "auto" });
    expect(r.event.payload).toMatchObject({ cause: "auto" });
  });

  it("undoSkip: not_completed(chosen) → scheduled, re-emits block_scheduled with undo", () => {
    const skipped = scheduled({ status: "not_completed", notCompletedCause: "chosen" });
    const r = ok(transition(skipped, { kind: "undoSkip" }));
    expect(r.patch).toMatchObject({ status: "scheduled", notCompletedCause: null });
    expect(r.event.eventType).toBe("block_scheduled");
    expect(r.event.payload).toMatchObject({ undo: true, partOfDay: "morning" });
  });

  it("remove: pool → removed", () => {
    const r = ok(transition(poolBlock(), { kind: "remove" }));
    expect(r.patch).toMatchObject({ status: "removed" });
    expect(r.event.eventType).toBe("block_removed");
  });

  it("remove: scheduled → removed", () => {
    const r = ok(transition(scheduled(), { kind: "remove" }));
    expect(r.patch.status).toBe("removed");
  });
});

describe("transition — illegal transitions are rejected (not thrown)", () => {
  const terminal: BlockStatus[] = ["done", "done_partial", "not_completed", "removed"];

  function expectIllegal(status: BlockStatus, trigger: Trigger) {
    const r = transition(poolBlock({ status }), trigger);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("illegal_transition");
  }

  it("cannot schedule anything that is not in the pool", () => {
    for (const s of ["scheduled", "active", ...terminal] as BlockStatus[]) {
      expectIllegal(s, { kind: "schedule", date: "2026-07-24", partOfDay: "morning" });
    }
  });

  it("cannot start a block that is not scheduled", () => {
    for (const s of ["pool", "active", ...terminal] as BlockStatus[]) {
      expectIllegal(s, { kind: "start", at: new Date() });
    }
  });

  it("cannot complete / stop-early a block that is not active", () => {
    for (const s of ["pool", "scheduled", ...terminal] as BlockStatus[]) {
      expectIllegal(s, { kind: "complete", at: new Date() });
      expectIllegal(s, { kind: "stopEarly", at: new Date() });
    }
  });

  it("cannot skip or auto-close a block that is not scheduled", () => {
    for (const s of ["pool", "active", ...terminal] as BlockStatus[]) {
      expectIllegal(s, { kind: "skip" });
      expectIllegal(s, { kind: "autoClose" });
    }
  });

  it("cannot move / returnToPool a block that is not scheduled", () => {
    for (const s of ["pool", "active", ...terminal] as BlockStatus[]) {
      expectIllegal(s, { kind: "move", date: "2026-07-24", partOfDay: "morning", reason: "planned_move" });
      expectIllegal(s, { kind: "returnToPool", reason: "planned_move" });
    }
  });

  it("cannot remove an active or terminal block", () => {
    for (const s of ["active", ...terminal] as BlockStatus[]) {
      expectIllegal(s, { kind: "remove" });
    }
  });

  it("undoSkip only reverses a CHOSEN skip, never an auto-close or other state", () => {
    // auto-close is silent and has no undo
    const auto = scheduled({ status: "not_completed", notCompletedCause: "auto" });
    expect(transition(auto, { kind: "undoSkip" }).ok).toBe(false);
    // a done block cannot be "un-skipped"
    expect(transition(scheduled({ status: "done" }), { kind: "undoSkip" }).ok).toBe(false);
  });
});

describe("transition — past-date guard (FR-4)", () => {
  it("schedule to a past date is rejected", () => {
    const r = transition(
      poolBlock(),
      { kind: "schedule", date: "2026-07-20", partOfDay: "morning" },
      { today: "2026-07-24" },
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("past_date");
  });

  it("schedule to today (even an already-passed part) is allowed", () => {
    const r = transition(
      poolBlock(),
      { kind: "schedule", date: "2026-07-24", partOfDay: "morning" },
      { today: "2026-07-24" },
    );
    expect(r.ok).toBe(true);
  });

  it("move to a past date is rejected; to today or later is allowed", () => {
    const ctx = { today: "2026-07-24" };
    const base = scheduled();
    expect(transition(base, { kind: "move", date: "2026-07-23", partOfDay: "morning", reason: "planned_move" }, ctx).ok).toBe(false);
    expect(transition(base, { kind: "move", date: "2026-07-25", partOfDay: "morning", reason: "planned_move" }, ctx).ok).toBe(true);
  });

  it("without a today context, the past-date guard is skipped", () => {
    expect(transition(poolBlock(), { kind: "schedule", date: "2000-01-01", partOfDay: "morning" }).ok).toBe(true);
  });
});

describe("isSchedulableDate", () => {
  it("today or later is schedulable, earlier is not", () => {
    expect(isSchedulableDate("2026-07-24", "2026-07-24")).toBe(true);
    expect(isSchedulableDate("2026-07-25", "2026-07-24")).toBe(true);
    expect(isSchedulableDate("2026-07-23", "2026-07-24")).toBe(false);
  });
});

describe("blocksToAutoClose — day-end auto-close in the user's timezone (DST-safe)", () => {
  type Row = { id: string; status: BlockStatus; scheduledDate: string | null };

  it("closes scheduled blocks whose civil day has passed, leaves today's alone", () => {
    // 2026-07-24 08:00 in Jerusalem
    const now = new Date("2026-07-24T05:00:00Z");
    const rows: Row[] = [
      { id: "yesterday", status: "scheduled", scheduledDate: "2026-07-23" },
      { id: "today", status: "scheduled", scheduledDate: "2026-07-24" },
      { id: "tomorrow", status: "scheduled", scheduledDate: "2026-07-25" },
      { id: "already-done", status: "done", scheduledDate: "2026-07-23" },
    ];
    const closed = blocksToAutoClose(rows, now, TZ).map((r) => r.id);
    expect(closed).toEqual(["yesterday"]);
  });

  it("does NOT auto-close an active block (that is the stale-active path)", () => {
    const now = new Date("2026-07-24T05:00:00Z");
    const rows: Row[] = [{ id: "left-open", status: "active", scheduledDate: "2026-07-23" }];
    expect(blocksToAutoClose(rows, now, TZ)).toEqual([]);
  });

  it("uses LOCAL civil midnight, not UTC — a block is not closed early across the UTC boundary", () => {
    // 2026-07-23T22:30Z is 2026-07-24 01:30 in Jerusalem (already the 24th),
    // so the 23rd's block IS closed; but 2026-07-23T20:30Z is 23:30 local on the
    // 23rd, so it is NOT yet closed.
    const rows: Row[] = [{ id: "b", status: "scheduled", scheduledDate: "2026-07-23" }];
    expect(blocksToAutoClose(rows, new Date("2026-07-23T22:30:00Z"), TZ).map((r) => r.id)).toEqual(["b"]);
    expect(blocksToAutoClose(rows, new Date("2026-07-23T20:30:00Z"), TZ)).toEqual([]);
  });

  it("handles the spring-forward DST day (25 → 24h has no effect on civil-date logic)", () => {
    // Israel DST 2026: clocks spring forward on Fri 2026-03-27. A block on the
    // 27th is still 'today' at local 10:00 on the 27th despite the short day.
    const rows: Row[] = [{ id: "dst", status: "scheduled", scheduledDate: "2026-03-27" }];
    // 2026-03-27T08:00Z = 11:00 local (UTC+3 after the jump) — same civil day.
    expect(blocksToAutoClose(rows, new Date("2026-03-27T08:00:00Z"), TZ)).toEqual([]);
    // Next civil day → closed.
    expect(blocksToAutoClose(rows, new Date("2026-03-28T08:00:00Z"), TZ).map((r) => r.id)).toEqual(["dst"]);
  });
});

describe("isStaleActive (FR-7) + elapsedMinutes", () => {
  const start = new Date("2026-07-24T09:00:00Z");

  it("is false for a non-active block", () => {
    expect(isStaleActive({ status: "scheduled", actualStartAt: null, durationMin: 30 }, new Date())).toBe(false);
  });

  it("is false before 3× the planned duration, true after", () => {
    const block = { status: "active" as BlockStatus, actualStartAt: start, durationMin: 30 };
    // 89 min < 90 (3×30) → not stale; 91 min > 90 → stale
    expect(isStaleActive(block, new Date(start.getTime() + 89 * 60_000))).toBe(false);
    expect(isStaleActive(block, new Date(start.getTime() + 91 * 60_000))).toBe(true);
  });

  it("elapsedMinutes floors and never goes negative", () => {
    expect(elapsedMinutes(start, new Date(start.getTime() + 90_000))).toBe(1);
    expect(elapsedMinutes(start, new Date(start.getTime() - 60_000))).toBe(0);
  });
});

describe("currentPartOfDay / partOfDayIndex", () => {
  it("maps local hour to a part of day", () => {
    // 06:00, 14:00, 20:00 local in Jerusalem
    expect(currentPartOfDay(new Date("2026-07-24T03:00:00Z"), TZ)).toBe("morning");
    expect(currentPartOfDay(new Date("2026-07-24T11:00:00Z"), TZ)).toBe("afternoon");
    expect(currentPartOfDay(new Date("2026-07-24T17:00:00Z"), TZ)).toBe("evening");
  });

  it("orders morning < afternoon < evening", () => {
    expect(partOfDayIndex("morning")).toBeLessThan(partOfDayIndex("afternoon"));
    expect(partOfDayIndex("afternoon")).toBeLessThan(partOfDayIndex("evening"));
  });
});

describe("sortDayBlocks / composeDay", () => {
  type T = {
    id: string;
    status: BlockStatus;
    partOfDay: "morning" | "afternoon" | "evening" | null;
    startTime: string | null;
    dayOrder: number | null;
  };
  const b = (id: string, o: Partial<T> = {}): T => ({
    id,
    status: "scheduled",
    partOfDay: "morning",
    startTime: null,
    dayOrder: null,
    ...o,
  });

  it("orders by part, then dayOrder, then start time", () => {
    const sorted = sortDayBlocks([
      b("eve", { partOfDay: "evening" }),
      b("m2", { partOfDay: "morning", dayOrder: 2 }),
      b("m1", { partOfDay: "morning", dayOrder: 1 }),
      b("aft-time", { partOfDay: "afternoon", startTime: "13:00" }),
    ]).map((x) => x.id);
    expect(sorted).toEqual(["m1", "m2", "aft-time", "eve"]);
  });

  it("foregrounds an active block and clears 'current' while it runs", () => {
    const now = new Date("2026-07-24T11:00:00Z"); // afternoon local
    const view = composeDay(
      [
        b("running", { status: "active", partOfDay: "morning" }),
        b("later", { partOfDay: "evening" }),
      ],
      now,
      TZ,
    );
    expect(view.active?.id).toBe("running");
    expect(view.current).toBeNull();
    expect(view.upcoming.map((x) => x.id)).toEqual(["later"]);
  });

  it("splits earlier-part scheduled blocks into passed (recovery), foregrounds the next", () => {
    const now = new Date("2026-07-24T11:00:00Z"); // afternoon local
    const view = composeDay(
      [
        b("missed", { partOfDay: "morning" }),
        b("nowish", { partOfDay: "afternoon" }),
        b("tonight", { partOfDay: "evening" }),
      ],
      now,
      TZ,
    );
    expect(view.passed.map((x) => x.id)).toEqual(["missed"]);
    expect(view.current?.id).toBe("nowish");
    expect(view.upcoming.map((x) => x.id)).toEqual(["tonight"]);
  });
});
