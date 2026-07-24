import { lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { loginAttempt, session, user } from "@/db/schema";
import { autoCloseElapsedDays } from "@/server/autoClose";

// The nightly backstop (PRD 03 §7, plan §1/§8). Two idempotent, free-tier-safe
// jobs: (1) the day-end auto-close of any leftover scheduled block, computed in
// each user's timezone (a second run finds nothing); (2) the only sanctioned
// cleanup — expired sessions and stale login attempts (IA Part G). The primary
// auto-close guarantee is still the lazy compute on first app open; this simply
// keeps the record honest when the app isn't opened.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const now = new Date();

  // (1) Auto-close elapsed days for every user (single-user today, but keep it
  // general). Each user's civil midnight is honoured via their timezone.
  const users = await db.select({ timezone: user.timezone }).from(user);
  let closed = 0;
  for (const u of users) {
    closed += await autoCloseElapsedDays(now, u.timezone);
  }

  // (2) Cleanup: expired sessions + login attempts older than 24h. These tables
  // are not the append-only event log, so deletes are fine here.
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  await db.delete(session).where(lt(session.expiresAt, now));
  await db.delete(loginAttempt).where(lt(loginAttempt.at, dayAgo));

  return NextResponse.json({ ok: true, closed });
}
