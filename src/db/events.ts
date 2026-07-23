import { db } from "./client";
import { events } from "./schema";

// The append-only event log's typed vocabulary. Every behavioral assertion the
// product makes is derived from these, never stored (binding constraint 4).
export const ENTITY = {
  template: "template",
  week: "week",
  goal: "goal",
  block: "block",
} as const;

// Event types per PRD 02 FR-9 (extended each milestone).
export const EVENT = {
  templateCreated: "template_created",
  templateEdited: "template_edited",
  templateArchived: "template_archived",
  weekCreated: "week_created",
  goalSet: "goal_set",
  goalEdited: "goal_edited",
  goalCleared: "goal_cleared",
  blockAddedToPool: "block_added_to_pool",
  blockEdited: "block_edited",
  blockRemoved: "block_removed",
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
