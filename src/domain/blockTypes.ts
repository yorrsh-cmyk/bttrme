// Pure shared types for the block model (src/domain rule: no I/O, no framework).
// The DB stores category/status as text; these unions are the source of truth
// and are validated at the server boundary.

export const BLOCK_CATEGORIES = [
  "work",
  "family",
  "personal",
  "health",
  "rest",
] as const;

export type BlockCategory = (typeof BLOCK_CATEGORIES)[number];

export function isBlockCategory(value: unknown): value is BlockCategory {
  return typeof value === "string" && (BLOCK_CATEGORIES as readonly string[]).includes(value);
}

// The full block lifecycle (PRD 03 §5 / IA Part E). M2 used only pool|removed;
// M3 adds the execution states. The DB column is text, so widening this union
// needed no DDL — only migration 003's new *fields* did.
export const BLOCK_STATUSES = [
  "pool",
  "scheduled",
  "active",
  "done",
  "done_partial",
  "not_completed",
  "removed",
] as const;

export type BlockStatus = (typeof BLOCK_STATUSES)[number];

export function isBlockStatus(value: unknown): value is BlockStatus {
  return typeof value === "string" && (BLOCK_STATUSES as readonly string[]).includes(value);
}

// Parts of day are the scheduling default (Gate 4). Exact start times are
// optional; a block always has a part of day once scheduled.
export const PARTS_OF_DAY = ["morning", "afternoon", "evening"] as const;

export type PartOfDay = (typeof PARTS_OF_DAY)[number];

export function isPartOfDay(value: unknown): value is PartOfDay {
  return typeof value === "string" && (PARTS_OF_DAY as readonly string[]).includes(value);
}

// A block reaches `not_completed` either because the user chose to skip it, or
// because its day ended with it still scheduled (a silent, neutral auto-close).
// Both are the SAME neutral state — the cause is recorded only so the daily
// review (M4) can phrase them identically (PRD 03 §14 mitigation).
export const NOT_COMPLETED_CAUSES = ["chosen", "auto"] as const;

export type NotCompletedCause = (typeof NOT_COMPLETED_CAUSES)[number];

// Why a block's date/part_of_day changed. A planned move happens at the day
// view; a deferral happens in the execution moment. Neither is a status change
// (IA Part E) — both append `block_moved` (PRD 03 FR-3).
export const MOVE_REASONS = ["planned_move", "deferred_in_moment"] as const;

export type MoveReason = (typeof MOVE_REASONS)[number];

// Rest is plannable like any other block from M2 (PRD 02 FR-? / user story 4);
// its first-class treatment in reviews/insights arrives in M5. The load signal
// measures non-rest time against the reference line, so rest never reads as
// "load" to be minimized.
export function isRest(category: BlockCategory): boolean {
  return category === "rest";
}
