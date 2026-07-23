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

// M2 uses only `pool` and `removed`; M3 (migration 003) extends the lifecycle
// with scheduled/active/done/done_partial/not_completed. The column is text,
// so extending this union needs no schema migration.
export const BLOCK_STATUSES = ["pool", "removed"] as const;

export type BlockStatus = (typeof BLOCK_STATUSES)[number];

// Rest is plannable like any other block from M2 (PRD 02 FR-? / user story 4);
// its first-class treatment in reviews/insights arrives in M5. The load signal
// measures non-rest time against the reference line, so rest never reads as
// "load" to be minimized.
export function isRest(category: BlockCategory): boolean {
  return category === "rest";
}
