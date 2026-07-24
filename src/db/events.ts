import { db } from "./client";
import { events } from "./schema";

// The append-only event log's typed vocabulary. Every behavioral assertion the
// product makes is derived from these, never stored (binding constraint 4).
export const ENTITY = {
  template: "template",
  week: "week",
  goal: "goal",
  block: "block",
  // A civil date (YYYY-MM-DD) as entity_id — the day-level markers hang off it
  // (day_auto_closed, absence_archived) rather than any single block.
  day: "day",
} as const;

// Event types per PRD 02 FR-9 (extended each milestone).
export const EVENT = {
  templateCreated: "template_created",
  templateEdited: "template_edited",
  templateArchived: "template_archived",
  templateDeleted: "template_deleted",
  weekCreated: "week_created",
  goalSet: "goal_set",
  goalEdited: "goal_edited",
  goalCleared: "goal_cleared",
  blockAddedToPool: "block_added_to_pool",
  blockEdited: "block_edited",
  blockRemoved: "block_removed",
  // M3 (PRD 03 §7): the execution lifecycle. block_moved carries from/to +
  // reason; block_completed carries full|partial; block_not_completed carries
  // the cause (chosen|auto). day_auto_closed / absence_archived are the
  // day-level markers for the two silent recovery paths.
  blockScheduled: "block_scheduled",
  blockMoved: "block_moved",
  blockStarted: "block_started",
  blockCompleted: "block_completed",
  blockNotCompleted: "block_not_completed",
  dayAutoClosed: "day_auto_closed",
  absenceArchived: "absence_archived",
} as const;

// The ONLY write path to the event log. Insert, never update, never delete —
// the append-only promise is checked statically by tests/events-append-only.test.ts.

export async function appendEvent(
  entityType: string,
  entityId: string,
  eventType: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  await db.insert(events).values({ entityType, entityId, eventType, payload });
}
