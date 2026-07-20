# PRD 01: Foundation and Authentication

Milestone: M1 · Layer: infrastructure · Status: Draft for Gate 4 approval

## 1. Milestone Objective

A deployed, secured, empty-but-alive application: repository, CI, production environment on free tiers, database with migrations, single-user login, and the responsive app shell. From the end of this milestone, a working app exists at a stable URL and every later milestone deploys into it.

## 2. User Problem Addressed

Indirectly, trust: the product asks the user to route his week through it, which requires it to be reliably reachable from phone and laptop, private, and durable from day one. Directly, it removes all infrastructure risk from later milestones so they can be judged purely on product behavior.

## 3. Scope

- GitHub repository, CI (typecheck, lint, unit tests), auto-deploy of `main` to Vercel (Hobby/free tier).
- Neon (free tier) Postgres, Drizzle ORM, drizzle-kit migrations, seed script for the single user.
- Username + password login, argon2id hashing, httpOnly encrypted session cookie, rate limiting.
- App shell: top-level navigation (This Week / Today / Library / Review — placeholder pages), phone-first layout, desktop layout.
- Settings storage: timezone and week-start day (Sunday or Monday), set once at seed, editable in a minimal settings page.
- `events` table created now (append-only), even though nothing writes to it until M2.
- Baseline backup posture: Neon point-in-time restore verified by an actual test restore.

## 4. User Stories

- As the user, I can open the app on my phone or laptop, sign in once, and stay signed in for weeks, so that using the app never begins with a login ritual.
- As the user, I can see that nobody without my password can reach any page or data.
- As the user, I land on a "This Week" screen (empty for now) whose navigation already reflects how the product thinks: week, today, library, review.

## 5. Functional Requirements

- FR-1: All routes except `/login` require an authenticated session; unauthenticated requests redirect to `/login`.
- FR-2: Login accepts username + password; verifies against a single `user` row with an argon2id hash; on success issues an httpOnly, `Secure`, `SameSite=Lax` session cookie with a 30-day rolling expiry.
- FR-3: No registration, password-reset, or account-management UI exists. Password changes happen via a documented CLI/seed script.
- FR-4: Login attempts are rate-limited (e.g., 5 failures → 15-minute lockout, tracked server-side); the lockout message is neutral ("Try again in a while"), not alarming.
- FR-5: Logout button in settings destroys the session.
- FR-6: Settings page shows and edits timezone, week-start day, and UI language; all stored on the `user` row.
- FR-8 (added at Gate 6): UI language — **Hebrew (עברית) or English** — selectable on the login screen and in settings; the choice persists. Hebrew renders fully right-to-left (`dir="rtl"`), English left-to-right. Every UI string lives in a typed bilingual catalog from the first commit; layout is built with direction-agnostic (logical) CSS properties so RTL is a first-class rendering, not a retrofit. The non-judgmental vocabulary constraint applies to **both** catalogs; the Hebrew phrasing is reviewed by the user (the native ear is the authority on judgment-free wording).
- FR-7: Database schema changes are only ever applied through drizzle-kit migrations, from this milestone forward.

## 6. Non-Functional Requirements

- HTTPS only (Vercel default); HSTS enabled.
- First meaningful paint of the Today screen < 2s on a mid-range phone over 4G, *including* Neon cold-start (measure; if cold starts break this, add the mitigation — a scheduled warm-up ping within free-tier limits — in this milestone).
- Session survives browser restarts and iOS Safari's storage behavior when saved to home screen.
- All secrets (session key, database URL) in Vercel environment variables; nothing secret in the repo.
- Passwords: argon2id with OWASP-recommended parameters.
- Cost: $0/month — a standing NFR for every milestone (binding Gate 2 constraint).

## 7. Data Model Changes

New tables:

- `user` — id, username, password_hash, timezone (IANA), week_start_day (`sun`|`mon`), created_at.
- `session` — id (opaque token hash), user_id, created_at, expires_at, last_seen_at.
- `login_attempt` — id, at, success (for rate limiting; pruned after 24h).
- `events` — id, at (timestamptz), entity_type, entity_id, event_type, payload (jsonb). Append-only; no updates or deletes ever.

## 8. Main User Flows

1. **First-time setup (developer-side):** seed script creates the user with username, initial password, timezone, week-start day.
2. **Login:** open app → login screen → credentials → land on This Week (empty state with one neutral sentence, no onboarding tour).
3. **Return visit:** open app → straight to This Week/Today (session valid) — the common path must feel instant.

## 9. Edge Cases

- Session expired mid-action → redirect to login, then return to the page the user was on.
- Rate-limit lockout while the real user mistypes → message states the wait time plainly; no email/recovery flow (personal tool; reset via script).
- Clock/timezone: user travels — timezone is a setting, not auto-detected; all "today" boundaries computed in the user's configured timezone.
- Neon free-tier connection limits: use Neon's pooled connection string; verify no connection exhaustion under normal navigation.

## 10. Acceptance Criteria

- [ ] App reachable over HTTPS at a stable URL; every non-login route redirects unauthenticated visitors.
- [ ] Login from an iPhone browser and a desktop browser; both sessions persist ≥ 7 days across restarts (verified in real use during the milestone).
- [ ] 5 failed logins trigger lockout; correct login after expiry works.
- [ ] CI green on `main`; a trivial change merged to `main` appears in production without manual steps.
- [ ] A test restore from Neon point-in-time recovery has been performed and documented in the repo README.
- [ ] Cold-start latency measured and recorded; mitigation applied if the 2s budget fails.
- [ ] No paid service anywhere in the pipeline.

## 11. Analytics / Observability Requirements

- `events` table exists (schema deployed) but no product events yet.
- Vercel's built-in function logs are the error log; a caught server error logs a structured line. No third-party error-tracking SaaS.

## 12. Out of Scope

- Any product feature (library, weeks, blocks). Placeholder pages only.
- Multi-user anything; password reset UI; OAuth; 2FA (single user, strong password, rate limiting — proportional).
- PWA manifest/offline (Layer 3).

## 13. Dependencies

- GitHub, Vercel, and Neon accounts created by the user (all free). The only milestone with external setup steps.

## 14. Risks and Open Questions

- **Risk:** Neon free-tier cold starts degrade the "open phone, see block, start" moment later. Measured here deliberately; mitigation decided here.
- **Risk:** iOS home-screen web-app cookie quirks force session re-login. Test early on the actual phone.
- ~~Open question~~ **Decided (Gate 4):** week starts on **Sunday** (seed default `week_start_day = sun`).
- ~~Open question~~ **Decided (Gate 4):** app name is **Bttrme**.

## 15. Definition of Done

All acceptance criteria checked; the user has signed in from phone and laptop and approved the shell's feel (Gate: M1 approval); README documents setup, seed, deploy, and restore procedures; no lint/type errors; unit tests for auth and session logic pass in CI.
