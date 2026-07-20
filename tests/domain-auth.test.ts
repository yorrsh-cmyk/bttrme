import { describe, expect, it } from "vitest";
import {
  LOCKOUT_THRESHOLD,
  LOCKOUT_WINDOW_MS,
  SESSION_TTL_MS,
  lockoutState,
  sessionExpiryFrom,
  sessionIsValid,
  shouldExtendSession,
} from "@/domain/auth";

const T0 = new Date("2026-07-20T12:00:00Z");
const minutesAgo = (m: number) => new Date(T0.getTime() - m * 60 * 1000);

describe("lockout", () => {
  it("stays unlocked below the threshold", () => {
    const failures = [1, 2, 3, 4].map(minutesAgo);
    expect(lockoutState(failures, T0)).toEqual({ locked: false });
  });

  it("locks at the 5th failure inside the window", () => {
    const failures = [1, 2, 3, 4, 5].map(minutesAgo);
    const state = lockoutState(failures, T0);
    expect(state.locked).toBe(true);
    // 15 minutes from the most recent failure (1 minute ago)
    expect(state.retryAt).toEqual(new Date(minutesAgo(1).getTime() + LOCKOUT_WINDOW_MS));
  });

  it("ignores failures older than the window", () => {
    const failures = [16, 17, 18, 19, 1].map(minutesAgo);
    expect(lockoutState(failures, T0).locked).toBe(false);
  });

  it("unlocks after the lockout elapses", () => {
    const failures = [14, 14, 14, 14, 14].map(minutesAgo);
    // retryAt = 14 minutes ago + 15 min = 1 minute from now → still locked
    expect(lockoutState(failures, T0).locked).toBe(true);
    // 2 minutes later it is open again
    const later = new Date(T0.getTime() + 2 * 60 * 1000);
    expect(lockoutState(failures, later).locked).toBe(false);
  });

  it("correct login after expiry works (threshold is exactly 5)", () => {
    expect(LOCKOUT_THRESHOLD).toBe(5);
    const failures = [1, 2, 3, 4].map(minutesAgo);
    expect(lockoutState(failures, T0).locked).toBe(false);
  });
});

describe("session lifetime", () => {
  it("is valid strictly before expiry", () => {
    expect(sessionIsValid(new Date(T0.getTime() + 1), T0)).toBe(true);
    expect(sessionIsValid(T0, T0)).toBe(false);
  });

  it("expiry is 30 days out", () => {
    expect(sessionExpiryFrom(T0).getTime() - T0.getTime()).toBe(SESSION_TTL_MS);
    expect(SESSION_TTL_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it("rolls the expiry at most once an hour", () => {
    expect(shouldExtendSession(minutesAgo(59), T0)).toBe(false);
    expect(shouldExtendSession(minutesAgo(60), T0)).toBe(true);
  });
});
