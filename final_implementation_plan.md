# Bttrme — Final Implementation Plan

Status: Draft for approval — Gate 7 of 7 (final gate before coding)
Consolidates: Phases 1–5 (all approved), PRDs 01–06, and the Gate 6 additions: **Hebrew + English UI, user-selectable, RTL-first**.

---

## 0. Requirement Addendum: Bilingual Application

Approved at Gate 6 and now binding across everything below:

- The UI ships in **Hebrew and English**; the user picks a language on the login screen and can change it in settings. The choice is stored on the `user` row.
- Hebrew renders **right-to-left** end to end. RTL is built first, not adapted later: all layout uses CSS logical properties (Tailwind's `ms-*/me-*/ps-*/pe-*`, `start/end` — never `ml-*/mr-*/left/right`), and `<html dir>` flips with the language.
- Every user-visible string lives in a **typed message catalog** (`i18n/en.ts`, `i18n/he.ts`) from the first commit. A unit test asserts the two catalogs have identical key sets, so a missing translation is a build failure, not a runtime surprise.
- No i18n framework: two typed dictionaries and a ~40-line helper are proportional for two locales and one user. Dates and weekday names come from `Intl.DateTimeFormat` with `he-IL` / `en-US` locales (weeks start Sunday in both, per the Gate 4 decision).
- The **non-judgmental vocabulary constraint applies per language**. The Hebrew catalog is not a translation task but a writing task; the user reviews the Hebrew copy of each milestone's key screens (execution view, reviews, recovery) as part of that milestone's acceptance. The automated vocabulary-guard test (see §6) runs against both catalogs with per-language forbidden-word lists.
- User content (block names, outcomes, goals, notes) is language-agnostic — stored as entered, rendered with `dir="auto"` so Hebrew content inside an English UI (and vice versa) displays correctly. The ICS feed carries UTF-8 and needs no special handling.
- The design proposal (`design_proposal.html`) remains English-only by explicit decision; it documents interaction, not copy.

## 1. Repository Structure

One repository, `bttrme`, on GitHub (private):

```
bttrme/
├── README.md                  # setup, seed, deploy, operations
├── RESTORE.md                 # tested restore procedure (PRD 06)
├── package.json, tsconfig.json, next.config.ts, tailwind.config.ts
├── drizzle.config.ts
├── drizzle/                   # generated SQL migrations (committed, append-only)
├── src/
│   ├── app/
│   │   ├── (auth)/login/              # login page (public) with language toggle
│   │   ├── (app)/                     # everything behind the session
│   │   │   ├── layout.tsx             # shell: header, tabs, dir/lang from user row
│   │   │   ├── page.tsx               # Today — execution view (default route)
│   │   │   ├── week/                  # weekly overview, planning, pool
│   │   │   ├── day/[date]/            # daily planning
│   │   │   ├── library/
│   │   │   ├── review/                # daily + weekly reviews, goal carry-forward
│   │   │   ├── insights/
│   │   │   └── settings/              # language, timezone, calendar, export, backup status
│   │   ├── calendar/[token]/route.ts  # ICS feed (public, token-gated) — M6
│   │   └── api/cron/route.ts          # nightly: auto-close backstop, snapshots, pruning
│   ├── domain/                # PURE logic, no I/O — the tested heart
│   │   ├── blockMachine.ts    # state machine: transitions, guards (PRD 03 §5)
│   │   ├── weekCycle.ts       # Sunday weeks, day boundaries, DST, timezone
│   │   ├── derive.ts          # daily/weekly review derivation (PRD 04)
│   │   ├── load.ts            # planned-hours signal (PRD 02)
│   │   └── insights/          # templates.ts (the audited module), compute.ts — M5
│   ├── db/                    # schema.ts (Drizzle), client.ts, events.ts (append helper)
│   ├── server/                # server actions + session.ts, rateLimit.ts, icsFeed.ts, exportData.ts
│   ├── i18n/                  # catalog.ts (types + helper), en.ts, he.ts
│   └── ui/                    # components (BlockCard, PartOfDayShelf, GoalSlots, …)
├── tests/                     # Vitest: domain/*, i18n parity, vocabulary guard
├── e2e/                       # Playwright: core flows, RTL smoke
└── scripts/                   # seed.ts, set-password.ts, restore-check.ts
```

The rule that keeps this honest: **`src/domain/` imports nothing from Next.js, the database, or the UI.** Every behavioral rule the product makes promises about (skip ≠ fail, auto-close phrasing, carry lineage) lives there, unit-tested.

## 2. Environments

| | Local development | Production |
|---|---|---|
| App | `next dev` on the Mac | Vercel (Hobby, free) — auto-deploy from `main` |
| Database | Neon **`dev` branch** (free; no local Postgres install needed) | Neon **`main` branch** |
| Secrets | `.env.local` (gitignored) | Vercel env vars |
| URL | localhost:3000 | `bttrme.vercel.app` (custom domain optional later) |

Environment variables (complete list): `DATABASE_URL`, `SESSION_SECRET` (32+ random bytes), `CRON_SECRET` (protects `/api/cron`), `BLOB_READ_WRITE_TOKEN` (M6, snapshot storage). Nothing else. Preview deployments are disabled (single user; `main` is the only deployed branch).

## 3. Database Migrations

- Schema lives in `src/db/schema.ts`; `drizzle-kit generate` produces SQL files into `drizzle/`, committed with the feature that needs them. Migrations are append-only; never edited after merge.
- Applied with `pnpm db:migrate` — run **manually against production before merging** the dependent code to `main` (solo-developer discipline; no destructive surprise mid-deploy). The README documents this as the one manual deploy step.
- Destructive changes (rename/drop) use the two-step expand-contract pattern — but the schema is designed in Phase 4 to make these rare.
- Migration sequence by milestone: **001** user/session/login_attempt/events (M1) · **002** block_template/week/weekly_goal/block-pool (M2) · **003** block scheduling + state fields (M3) · **004** daily_review/weekly_review/goal-lineage (M4) · **005** observations flag + insight_dismissal (M5) · **006** calendar_feed/snapshot_log/part-of-day windows (M6).

## 4. Authentication Setup

Per PRD 01, concretely:

- `argon2id` via the `@node-rs/argon2` package (OWASP parameters: 19 MiB memory, t=2, p=1). Login route is a Node runtime function (not Edge) for native hashing.
- Session: 32-byte random token, stored **hashed** in `session`, delivered as an httpOnly `Secure` `SameSite=Lax` cookie; rolling 30-day expiry (refreshed on use); validated in the `(app)` layout via middleware.
- Rate limiting: `login_attempt` table, 5 failures → 15-minute lockout, neutral message in the active language.
- `scripts/seed.ts` creates the user (`username`, prompted password, timezone, `week_start_day='sun'`, language) — run once against each environment. `scripts/set-password.ts` is the reset path.
- Seed values to confirm at this gate: **timezone `Asia/Jerusalem`, initial language Hebrew** (both changeable in settings afterward).

## 5. Development Order

Strictly milestone-by-milestone; each ends deployed, used, and approved per the Phase 3 gates. Within each milestone, domain module → unit tests → server actions → UI → e2e → deploy.

1. **M1 — Foundation** (PRD 01): repo bootstrap (Next.js, TypeScript strict, Tailwind, Drizzle, Vitest, Playwright, GitHub Actions CI: typecheck + lint + unit on every push) → migration 001 → auth + session + rate limit → **i18n foundation: catalog types, both catalogs, `dir` switching, login-screen language toggle** → app shell with RTL-correct navigation → seed both environments → Vercel deploy → Neon PITR restore test → cold-start latency measurement. *Exit: you sign in from phone + laptop, in Hebrew, and approve the shell.*
2. **M2 — Weekly planning** (PRD 02): migration 002 → `load.ts` + `weekCycle.ts` (Sunday weeks, tested) → library CRUD → week + goals + pool + load signal → events wiring → Hebrew copy review of planning screens. *Exit: a real week planned in <10 min.*
3. **M3 — Execution** (PRD 03): migration 003 → `blockMachine.ts` fully tested (every transition, DST, auto-close) → day scheduling UI → execution view (four responses, ≤2 taps) → recovery screens → cron backstop for auto-close → Hebrew copy review of execution + recovery (the most sensitive copy in the product). *Exit: ≥3 real days, including a genuine miss and recovery.*
4. **M4 — Reviews** (PRD 04): migration 004 → `derive.ts` (pure, tested, re-derivable) → daily review (<60s) → weekly review + carry/rephrase/let-go → planning-screen integration → full-loop Playwright flow. *Exit: MVP complete; the validation period begins with its question list written down.*
5. **— Validation period (3–4 weeks, no development).** Findings reviewed together; M5 scope re-confirmed or revised (hard gate from Phase 3).
6. **M5 — The Mirror** (PRD 05): migration 005 → observation events → `insights/templates.ts` (hand-written in both languages, audited against the grammar rule) → insights panel → escape logger with off-switch → re-entry polish informed by validation findings.
7. **M6 — Calendar + portability** (PRD 06, parallelizable with M5): migration 006 → shared JSON serializer → export button → ICS feed (RFC 5545 + VTIMEZONE, validated in Google + Apple) → nightly snapshot cron to Vercel Blob (fallback: Cloudflare R2; both free at this volume) → restore drill → `RESTORE.md` corrected to reality.

## 6. Test Strategy

- **Unit (Vitest), the center of gravity — `src/domain/`:** block state machine (legal/illegal transitions, causes, auto-close, 3×-duration prompt), week cycle (Sunday boundaries, `Asia/Jerusalem` DST, timezone changes), review derivation (partials, moves, auto-closes, re-derivation after late edits), goal lineage, load signal, insight computation and thresholds.
- **Guard tests (Vitest), encoding the product's promises:**
  - *Catalog parity:* `en.ts` and `he.ts` expose identical key sets.
  - *Vocabulary guard:* no forbidden judgment terms in either catalog (per-language lists — English: "failed/overdue/lazy/behind/streak/…"; Hebrew list drafted with the user at M1 and grown at each copy review). The list lives in the repo; a violation fails CI.
  - *No-hardcoded-strings lint rule* on `src/ui/` and `src/app/` (JSX text must come from the catalog).
  - *Event-log immutability:* no `update`/`delete` call sites against `events` (static check).
- **End-to-end (Playwright), the few flows that matter:** login (both languages; RTL smoke asserts `dir="rtl"` and start-aligned layout) · plan week → schedule day → start/defer/skip/complete → daily review → weekly review → goals carried · recovery after simulated absence · ICS feed content (M6). Run in CI against a Neon test branch.
- **On-device manual pass per milestone** (the phone is the product): the milestone's exit criteria, performed on the actual iPhone, in Hebrew.
- Explicit non-goals: no coverage targets, no visual-regression tooling, no load testing. Tests protect the loop and the language, not the pixels.

## 7. Deployment Steps (First Production Setup)

1. Create the private GitHub repo; push the M1 skeleton.
2. Create the Neon project (free tier): `main` + `dev` branches; note both pooled connection strings.
3. Create the Vercel project (Hobby) linked to the repo; set env vars; disable preview deployments.
4. Run migration 001 against Neon `main`; run `scripts/seed.ts` (user, `Asia/Jerusalem`, Sunday, Hebrew).
5. Merge to `main` → first auto-deploy → verify HTTPS, login from phone + laptop, session persistence.
6. Perform the Neon PITR test-restore against a scratch branch; record the procedure in `RESTORE.md`.
7. Measure phone cold-start latency; if >2s, add the warm-up cron now (PRD 01 NFR).
Routine deploys thereafter: migrate prod if needed → merge to `main` → Vercel deploys → on-device smoke.

## 8. Rollback and Backup Strategy

- **App rollback:** Vercel keeps every deployment; "Promote previous deployment" is instant. Because migrations are applied ahead of code and are additive-by-default, the previous app version always runs against the current schema.
- **Bad migration:** Neon point-in-time restore to the minute before (branch → verify → promote), documented in `RESTORE.md`. Data loss window is bounded by the incident's own duration — acceptable for one user, stated honestly.
- **Backups, three independent layers (PRD 06):** Neon PITR (disaster) · nightly compressed JSON snapshots to Blob, 30 daily + 12 monthly (app-level, provider-independent) · in-UI export (user-held). Restore from the JSON path is drilled once in M6 and after any storage change.
- **Failure visibility:** `snapshot_failed` surfaces in settings (the one sanctioned nag); cron route is idempotent and retries nightly by design.

## 9. Initial Production Release Checklist (End of M1)

- [ ] HTTPS + HSTS verified; every non-login, non-feed route redirects unauthenticated.
- [ ] `SESSION_SECRET`/`CRON_SECRET` are unique 32+-byte values; no secrets in the repo (checked).
- [ ] argon2id parameters verified; rate limiting fires after 5 failures; message correct in both languages.
- [ ] Login + 7-day session persistence verified on iPhone Safari (including home-screen mode) and desktop.
- [ ] Language toggle: Hebrew RTL and English LTR both render the shell correctly; choice persists.
- [ ] CI green: typecheck, lint, unit, catalog parity, vocabulary guard.
- [ ] Neon PITR restore performed once; `RESTORE.md` exists.
- [ ] Cold-start budget met or mitigated; `$0/month` confirmed across Vercel + Neon dashboards.

## 10. What I Need From You at This Gate

1. **Approval of this plan** — after which I start coding M1.
2. Confirm the seed values: timezone **Asia/Jerusalem**, initial language **Hebrew**.
3. During M1 you'll be asked to: create the GitHub/Vercel/Neon accounts (or hand me existing ones), choose the username + initial password at seed time, and spend ten minutes on the first **Hebrew vocabulary session** — agreeing the forbidden-word list and the phrasing for the six core state words (completed / not completed / deferred / moved / skipped / stopped early). That list becomes a CI test the same day.

---

*Awaiting Gate 7 approval. Per the approved process, no production code is written until you approve this plan.*
