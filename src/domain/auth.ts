// Pure auth timing rules — no I/O, no framework (the src/domain rule).
// PRD 01 FR-4: 5 failures -> 15-minute lockout, neutral messaging.
// PRD 01 FR-2: 30-day rolling session expiry.

export const LOCKOUT_THRESHOLD = 5;
export const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
// Rolling expiry is refreshed at most once an hour — a cheap write bound,
// invisible to a 30-day horizon.
export const SESSION_REFRESH_INTERVAL_MS = 60 * 60 * 1000;

export interface LockoutState {
  locked: boolean;
  /** When trying again becomes possible; only set while locked. */
  retryAt?: Date;
}

/**
 * Decide lockout from the recent failure timestamps.
 * Attempts made *during* a lockout are rejected without being recorded,
 * so a lockout never extends itself (mistyping is not punished twice).
 */
export function lockoutState(recentFailures: readonly Date[], now: Date): LockoutState {
  const windowStart = now.getTime() - LOCKOUT_WINDOW_MS;
  const inWindow = recentFailures
    .map((d) => d.getTime())
    .filter((t) => t > windowStart)
    .sort((a, b) => a - b);

  if (inWindow.length < LOCKOUT_THRESHOLD) {
    return { locked: false };
  }

  // Lockout runs 15 minutes from the failure that crossed the threshold
  // (the most recent recorded one).
  const lastFailure = inWindow[inWindow.length - 1]!;
  const retryAt = new Date(lastFailure + LOCKOUT_WINDOW_MS);
  return now < retryAt ? { locked: true, retryAt } : { locked: false };
}

export function sessionIsValid(expiresAt: Date, now: Date): boolean {
  return now < expiresAt;
}

export function shouldExtendSession(lastSeenAt: Date, now: Date): boolean {
  return now.getTime() - lastSeenAt.getTime() >= SESSION_REFRESH_INTERVAL_MS;
}

export function sessionExpiryFrom(now: Date): Date {
  return new Date(now.getTime() + SESSION_TTL_MS);
}
