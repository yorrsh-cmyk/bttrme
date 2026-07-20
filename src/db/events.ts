import { db } from "./client";
import { events } from "./schema";

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
