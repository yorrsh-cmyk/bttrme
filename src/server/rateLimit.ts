import "server-only";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db/client";
import { loginAttempt } from "@/db/schema";
import { LOCKOUT_WINDOW_MS, lockoutState, type LockoutState } from "@/domain/auth";

// PRD 01 FR-4. Single-user app: the limit is global, not per-IP — anyone
// hammering the door locks the door, which is exactly the wanted behavior.

export async function currentLockout(now = new Date()): Promise<LockoutState> {
  const windowStart = new Date(now.getTime() - LOCKOUT_WINDOW_MS);
  const failures = await db
    .select({ at: loginAttempt.at })
    .from(loginAttempt)
    .where(and(eq(loginAttempt.success, false), gt(loginAttempt.at, windowStart)));
  return lockoutState(failures.map((f) => f.at), now);
}

/** Attempts during an active lockout are rejected earlier and never recorded. */
export async function recordAttempt(success: boolean): Promise<void> {
  await db.insert(loginAttempt).values({ success });
}
