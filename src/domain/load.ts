// Pure planned-load signal (src/domain rule: no I/O, no framework).
// PRD 02 FR-7 + NFR: total planned hours vs. a soft reference line; crossing it
// changes the *message*, never blocks. The signal measures NON-REST time — rest
// is planned time we want, not load to minimize. The grammar rule (Phase 1)
// keeps the fact on the WEEK, never "you": this module returns a level, and the
// catalog owns the wording ("this is a heavy week", not "you overloaded").

import { BLOCK_CATEGORIES, type BlockCategory, isRest } from "./blockTypes";

export interface LoadBlock {
  category: BlockCategory;
  durationMin: number;
}

export type LoadLevel = "within" | "heavy";

export interface LoadSummary {
  totalMinutes: number;
  nonRestMinutes: number;
  restMinutes: number;
  /** Non-rest planned hours, rounded to one decimal — the number shown. */
  plannedHours: number;
  /** Minutes per category (every category present, 0 if none). */
  byCategory: Record<BlockCategory, number>;
  thresholdHours: number;
  level: LoadLevel;
}

export const DEFAULT_LOAD_THRESHOLD_HOURS = 20;

function emptyByCategory(): Record<BlockCategory, number> {
  return Object.fromEntries(BLOCK_CATEGORIES.map((c) => [c, 0])) as Record<
    BlockCategory,
    number
  >;
}

/**
 * Summarize the pool's planned load. `blocks` are the week's pool blocks
 * (already filtered to status = 'pool' by the caller).
 */
export function computeLoad(
  blocks: readonly LoadBlock[],
  thresholdHours: number = DEFAULT_LOAD_THRESHOLD_HOURS,
): LoadSummary {
  const byCategory = emptyByCategory();
  let totalMinutes = 0;
  let restMinutes = 0;

  for (const block of blocks) {
    const minutes = Math.max(0, block.durationMin);
    byCategory[block.category] += minutes;
    totalMinutes += minutes;
    if (isRest(block.category)) restMinutes += minutes;
  }

  const nonRestMinutes = totalMinutes - restMinutes;
  const plannedHours = Math.round((nonRestMinutes / 60) * 10) / 10;
  // A non-positive threshold disables the "heavy" signal rather than making
  // every week heavy.
  const level: LoadLevel =
    thresholdHours > 0 && nonRestMinutes > thresholdHours * 60 ? "heavy" : "within";

  return {
    totalMinutes,
    nonRestMinutes,
    restMinutes,
    plannedHours,
    byCategory,
    thresholdHours,
    level,
  };
}
