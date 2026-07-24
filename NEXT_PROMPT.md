# Prompt for the next session — start Milestone 3

Copy-paste this into a fresh Claude Code session in this folder (after `/clear`):

---

Read `CLAUDE.md`, `final_implementation_plan.md`, `PRD_03_Daily_Execution_and_Block_Management.md`, and the block lifecycle in `phase_4_information_architecture.md` (Part E), then begin implementing **Milestone 3 (Daily Execution and Block Management)**.

Context: M1 (foundation/auth) and M2 (weekly planning) are complete, deployed to `bttrme-ashen.vercel.app`, and approved. The stack, i18n foundation, event log, and the block/week/goal model already exist. **Node lives at `~/.local/node`** — run `export PATH="$HOME/.local/node/bin:$PATH"` first (pnpm, not npm). Neon dev URL is in `.env.local`; the prod (`main`) pooled URL is in my Vercel env and I can paste it when a migration needs applying. Dev DB has a throwaway user `devuser` / `dev-throwaway-pass-123` for e2e (`E2E_USERNAME`/`E2E_PASSWORD`).

M3 is the heart of the product (PRD 03 §1): the execution moment. The overriding rule for every screen and every string — **silence in the moment, no judgment, no aggregate numbers, no red** (PRD 03 §6, FR-6). A miss is a neutral recorded transition that triggers recovery, never debt.

Work in this order (per `final_implementation_plan.md` §5, and within-milestone: domain → unit tests → server actions → UI → e2e → deploy):

1. **Migration 003** — extend `block` with: `scheduled_date`, `part_of_day` (`morning|afternoon|evening`), `start_time?`, `day_order`, `actual_start_at?`, `actual_end_at?`, `not_completed_cause?` (`chosen|auto`), `goal_id?` (FK → `weekly_goal`, the optional "why this day" link). Also add `user.day_end_hour` (IA default 20) — it is not yet a column. The `block.status` column is already `text`, so extending the status union needs no DDL. Append-only discipline: apply to prod before merging dependent code.
2. **`src/domain/blockMachine.ts`** (pure, no I/O) — the one real state machine, fully unit-tested: every legal transition and every illegal-transition rejection (`pool→scheduled→active→done|done_partial`; `scheduled→not_completed`; any pre-active→`removed`), the triggers (Start/Done/Stopped-early/Skip/Defer/Move), day-end auto-close (cause `auto`) computed in the user's timezone incl. DST, and the 3×-duration "is this still going?" prompt for a stale `active` block (FR-7). Moves/defers are events that update date/part_of_day, not status changes (PRD 03 §5 / IA Part E).
3. **Day scheduling** — assign pool blocks to (date, part_of_day) with optional start_time; reorder within a part of day; move. Each move appends `block_moved` with from/to + reason (`planned_move|deferred_in_moment`). No scheduling into the past (FR-4).
4. **Today / execution view** — the current block foregrounded with full pre-decided context (name, outcome, duration, part of day, why-this-day, **first action visually primary**) and exactly four responses, each ≤2 taps; Skip is one tap + undo (no confirm dialog). Active block shows elapsed-vs-planned neutrally (no red at overrun).
5. **Recovery flows** — passed-window screen (per-block Defer/Move/Skip + "Skip all for today"), and after ≥2 absent days a one-tap "Archive missed days" landing on a clean today. No backfilling ever requested.
6. **`/api/cron`** auto-close backstop (protected by `CRON_SECRET`, already provisioned) — lazy compute on first open after the day boundary, plus a daily Vercel cron. Free-tier-safe, idempotent.
7. **Hebrew copy review with me** — pause for this on the execution + recovery screens specifically; it is the most sensitive copy in the product and I'm the authority on judgment-free phrasing.

New events: `block_scheduled`, `block_moved`, `block_started`, `block_completed` (full|partial), `block_not_completed` (cause), `day_auto_closed`, `absence_archived` — add to the `EVENT` map in `src/db/events.ts`.

M3 is done when I've run **≥3 real days** through it, including **≥1 genuine miss and recovery**, and approved it (PRD 03 §15). Don't start M4 without my approval.

---

## Notes for me (Michael), before that session

- Budget ~10 minutes for the execution/recovery Hebrew copy review — this is the copy that decides whether I want to open the app at a heavy moment.
- I'll run 3 real days on my phone as the acceptance trial; plan to include a day I genuinely miss something, to test the recovery flow for real.
- Have the prod Neon `main` pooled URL handy for when migration 003 needs applying to production.
