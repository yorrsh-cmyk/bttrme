import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db/client";
import { session, user } from "@/db/schema";
import {
  sessionExpiryFrom,
  sessionIsValid,
  shouldExtendSession,
} from "@/domain/auth";

export const SESSION_COOKIE = "bttrme_session";

function requireSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set (32+ bytes)");
  }
  return secret;
}

// The cookie carries the raw token; the DB only ever sees this keyed hash,
// so a leaked database cannot mint sessions (PRD 01 FR-2).
export function hashSessionToken(token: string, secret = requireSecret()): string {
  return createHmac("sha256", secret).update(token).digest("hex");
}

export type SessionUser = typeof user.$inferSelect;

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  await db.insert(session).values({
    id: hashSessionToken(token),
    userId,
    expiresAt: sessionExpiryFrom(now),
    lastSeenAt: now,
  });
  await setSessionCookie(token, sessionExpiryFrom(now));
}

async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * Validates the session cookie and returns the user row, or null.
 * Applies the rolling 30-day expiry (refreshed at most hourly).
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const id = hashSessionToken(token);
  const rows = await db
    .select({ session: session, user: user })
    .from(session)
    .innerJoin(user, eq(session.userId, user.id))
    .where(eq(session.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const now = new Date();
  if (!sessionIsValid(row.session.expiresAt, now)) {
    await db.delete(session).where(eq(session.id, id));
    return null;
  }

  if (shouldExtendSession(row.session.lastSeenAt, now)) {
    await db
      .update(session)
      .set({ lastSeenAt: now, expiresAt: sessionExpiryFrom(now) })
      .where(eq(session.id, id));
  }

  return row.user;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(session).where(eq(session.id, hashSessionToken(token)));
  }
  store.delete(SESSION_COOKIE);
}
