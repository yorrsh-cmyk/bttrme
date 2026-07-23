# CLAUDE.md — Bttrme

Personal (single-user) web app for Michael that bridges the gap between intention and action. This is **not** a productivity/task app — read `phase_1_need_interpretation.md` before touching product behavior.

## Current status (2026-07-23)

**M1 (Foundation and Authentication) is complete, deployed, and approved.** Live at `bttrme-ashen.vercel.app` (Vercel Hobby); Neon `main` + `dev` branches; migration 001 applied; single user seeded (`yorrsh`, Asia/Jerusalem, Sunday, Hebrew). All PRD 01 §10 acceptance criteria met — HTTPS+HSTS, iPhone+laptop sign-in incl. home-screen mode, 5-failure lockout (verified), bilingual RTL/LTR shell, CI green, Neon PITR restore drilled (see `RESTORE.md`), cold-start bearable (<2s, no warm-up cron), $0/month.

Next step: **await approval to begin Milestone 2 (Weekly Planning Core)** per `PRD_02_Weekly_Planning_Core.md`. Do not start M2 without Michael's go-ahead. First M2 tasks: migration 002 → `load.ts` + `weekCycle.ts` (pure, tested) → library CRUD → week/goals/pool/load signal → events wiring → Hebrew copy review of planning screens.

## Source-of-truth documents (in this folder, all approved)

| Document | Role |
|---|---|
| `need_brief_intention_to_action_en.md` | The user need — primary source of truth |
| `phase_1_need_interpretation.md` | Interpretation, risks, principles |
| `phase_2_scope_and_stack.md` | Scope layers + stack decisions |
| `phase_3_milestone_plan.md` | 6 milestones + validation period + cross-milestone rules |
| `PRD_01`–`PRD_06` (*.md) | Per-milestone requirements |
| `phase_4_information_architecture.md` | **Authoritative data model** (PRDs defer to it) |
| `design_proposal.html` | Approved interaction design (English-only by decision) |
| `final_implementation_plan.md` | Repo structure, environments, dev order, tests, deploy |

## Binding constraints — never violate

1. **Free services only.** Vercel Hobby + Neon free tier. $0/month is a standing NFR. Never introduce a paid dependency.
2. **Bilingual Hebrew + English, RTL-first.** Every UI string goes through the typed catalogs (`i18n/en.ts`, `i18n/he.ts`) — no hardcoded strings. Layout uses only logical CSS properties (`ms-*/me-*/ps-*/pe-*`, start/end — never `ml-*/mr-*/left/right`). User content renders with `dir="auto"`.
3. **Non-judgmental vocabulary, structurally.** States: completed / not completed / deferred / moved / skipped / stopped early. Forbidden (both languages, enforced by CI guard test): failed, overdue, lazy, behind, streak, and similar. No red in the palette. No percentages-as-scores, no streaks, no aggregate numbers on the execution view. Grammar rule for derived text: facts belong to blocks and weeks, never "you."
4. **The `events` table is append-only.** No UPDATE/DELETE ever. All behavioral assertions are derived from it, never stored.
5. **`src/domain/` is pure** — no imports from Next.js, the DB, or UI. All behavioral rules live there, unit-tested.
6. **Honesty is cheap:** reporting a miss must cost ≤ reporting a success (skip = one tap + undo). A miss triggers recovery, never debt. Re-entry after absence asks for nothing.
7. **Milestone gates:** each milestone ships to production and is approved through real use before the next begins. After M4 (MVP) comes a 3–4-week live validation period with **no development**. M5 scope must be re-confirmed against its findings.
8. **Hebrew copy review:** Michael (the user) reviews the Hebrew wording of each milestone's key screens — the native ear is the authority on judgment-free phrasing. Hebrew catalog is writing, not translation.

## Fixed decisions

- Week starts **Sunday**. Timezone seed: **Asia/Jerusalem**. Initial language: **Hebrew**.
- App name: **Bttrme**.
- Stack: Next.js (App Router) + TypeScript strict + Tailwind; Drizzle + Neon Postgres; Vercel; hand-rolled single-user auth (argon2id, hashed session token, httpOnly cookie, rate limiting). No auth SaaS, no analytics SaaS, no i18n framework.
- Calendar: one-way token-secured ICS feed (M6). Rest blocks are exported, name-only. First actions/notes/completion states never leave the app.
- Parts of day (morning/afternoon/evening) are the scheduling default; exact times optional.
- Blocks copy template fields at creation (history is immutable). Pool blocks expire with their week — no auto-carry.
- Migrations: drizzle-kit, append-only, run manually against prod before merging dependent code.

## Working style for this project

- Follow the development order in `final_implementation_plan.md` §5. Within a milestone: domain module → unit tests → server actions → UI → e2e → deploy.
- When a product-behavior question arises, the need brief and Phase 1 principles decide it — not productivity-app conventions.
- Scope changes mid-milestone go into the next milestone's PRD, not the current build.
