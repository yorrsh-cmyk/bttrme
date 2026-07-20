# PRD 03: Daily Execution and Block Management

Milestone: M3 · Layer: 1 (MVP) · Status: Draft for Gate 4 approval

## 1. Milestone Objective

The heart of the product: place pool blocks onto days and parts of day, and give the execution moment a phone-first view that presents full pre-decided context with exactly four bounded responses — plus the no-shame recovery flow for missed blocks. After M3, the product either earns its place at the moment of heaviness or it doesn't.

## 2. User Problem Addressed

The core problem from Phase 1: each planned action carries hidden negotiation and identity stakes at the moment of execution. This milestone discharges the negotiation (everything is pre-decided; the view asks nothing) and the identity stakes (every outcome, including skipping, is a neutral recorded transition; a miss triggers a recovery path, never a debt). Directly serves brief JTBDs 3, 4, and 5 ("help me begin without reopening the debate," "a clear way back without self-attack," "continue from the current point").

## 3. Scope

- Day scheduling: assign pool blocks to a date + part of day (morning / afternoon / evening), optional exact start time; reorder; move.
- Today screen: the day's blocks in order, with the **current block** foregrounded.
- Execution view: full block context + four responses (Start / Defer to later today / Move to another day / Skip) + close-out (Done / Stopped early).
- Recovery flow: passed-window screen, end-of-day auto-close, multi-day-absence bulk archive.
- Full block state machine, unit-tested, every transition an event.

Not in scope: reviews (M4), any aggregate numbers on any screen.

## 4. User Stories

- As the user, when I plan a day I want to choose from the week's pool and place blocks into morning/afternoon/evening, so the day is realistic for my time and energy (brief JTBD 2).
- As the user, when a block's time arrives I want one screen that tells me what, what counts as done, how long, why today, and the first physical action — so starting requires no thinking (brief §9, "immediately before starting").
- As the user, when I can't or won't start, I want to answer with one honest tap (defer / move / skip) that costs no more than pretending, so my record stays true.
- As the user, when I open the app after ignoring it for hours or days, I want one calm screen that lets me continue from now, so a bad afternoon doesn't become a ruined week (brief JTBD 5).

## 5. Functional Requirements

**Scheduling**
- FR-1: A pool block can be scheduled to (date, part_of_day) within its week; exact start time optional. Rescheduling (any move) is ≤ 2 taps from the day view.
- FR-2: Blocks can be reordered within a part of day; order is preserved.
- FR-3: Moving a block to another day, or back to the pool, never edits history — it appends `block_moved` with from/to and a reason tag (`planned_move` | `deferred_in_moment`).
- FR-4: Scheduling to a past date is impossible; scheduling within today to an already-passed part of day is allowed (the user knows his day).

**State machine** (statuses: `pool → scheduled → active → done | done_partial`; `scheduled → not_completed`; any → `removed`)
- FR-5: Transitions and their triggers:
  - Start → `active` (records actual_start_at).
  - Done / Stopped early → `done` / `done_partial` (records actual_end_at). "Stopped early" is a valid completion, not a failure state.
  - Skip → `not_completed` with cause `chosen`.
  - Defer to later today → stays `scheduled`, part_of_day updated, event with reason `deferred_in_moment`.
  - Move to another day → stays `scheduled`, date updated, same event shape.
  - Day-end auto-close → any still-`scheduled` block of that day → `not_completed` with cause `auto`. Silent; surfaced only in the daily review (M4).
- FR-6: No state or event may use judgment vocabulary in code, database values, or UI (`not_completed`, never `failed`/`missed`).
- FR-7: An `active` block left open past ~3× its duration prompts a neutral close-out question next time the app opens ("Is this still going?") rather than auto-failing it.

**Execution view**
- FR-8: Today's foregrounded card shows: name, expected outcome, duration, part of day (+ time if set), why-this-day (the week goal it serves, if linked — else category), and **first action, visually primary**.
- FR-9: Exactly four response buttons; each response completes in ≤ 2 taps including confirmation (Skip has a one-tap undo instead of a confirm dialog — cheaper honesty).
- FR-10: While a block is `active`, the view shows elapsed vs. planned time neutrally (no red at overrun; overrun is not an error) and the close-out buttons.

**Recovery**
- FR-11: Opening the app when the current part of day has unresolved earlier blocks shows one neutral screen: "These blocks' time passed" with per-block Defer / Move / Skip — or one "Skip all for today." No red, no exclamation marks, no count-badges.
- FR-12: After ≥ 2 days of no app activity, the first screen offers one-tap "Archive missed days" (bulk `not_completed`, cause `auto`) and lands on today. Backfilling is never requested.

## 6. Non-Functional Requirements

- Today screen interactive < 2s on phone over 4G including cold start (the M1 budget, now enforced on the screen that matters).
- All four responses usable one-handed on a phone; touch targets ≥ 44px.
- The execution view contains **zero aggregate numbers** (no "3 of 7 done") — a standing constraint, not a styling choice.
- Correctness of day boundaries and auto-close in the user's configured timezone, including DST transitions.

## 7. Data Model Changes

Extend `block`: status enum extended (`pool | scheduled | active | done | done_partial | not_completed | removed`), scheduled_date, part_of_day (`morning|afternoon|evening`), start_time (nullable), day_order, actual_start_at, actual_end_at, not_completed_cause (`chosen|auto`, nullable), goal_id (nullable link to `weekly_goal` — the "why this day" line; added here, populated at scheduling time if the user picks one).

New events: `block_scheduled`, `block_moved`, `block_started`, `block_completed` (payload: full|partial), `block_not_completed` (payload: cause), `day_auto_closed`, `absence_archived`.

Auto-close mechanics: computed lazily on first app open after the day boundary (plus a daily Vercel cron as backstop) — free-tier-safe, no long-running processes.

## 8. Main User Flows

1. **Plan today (or tomorrow evening-before):** Today (or day view) → pull from pool → tap part of day → optionally set time → done. Target: under 3 minutes.
2. **Execute:** open app at a heavy moment → today's current block fills the screen → read first action → tap Start → work → tap Done.
3. **Honest non-start:** same screen → tap Skip (one tap, undoable) or Defer → app shows the next block or a calm empty state ("Nothing more scheduled for this part of the day").
4. **Recover:** open app at 21:00 after avoiding since 14:00 → one screen resolves the afternoon in two taps → evening block is foregrounded as if nothing happened. Because nothing *did* happen except data.

## 9. Edge Cases

- Two blocks `active` at once → starting a second prompts closing the first (one tap each option).
- Block deferred repeatedly within one day → allowed without comment; the pattern is visible only in M5 insights, never in the moment (Phase 1 tension: history vs. shame archive — resolved toward silence in the moment).
- Day with zero scheduled blocks → Today shows the pool as a calm "if you want" list, clearly optional — an empty day is not an error.
- Week ends with blocks still in pool → they simply expire with the week (visible in M4's weekly review as "planned but never scheduled"); no automatic carry-over of unfinished blocks into the new week (that would be imported debt — the weekly planning session decides fresh).
- User in a different timezone temporarily → boundaries follow the settings timezone; changing the setting mid-day re-computes "today" from now on, never retroactively.
- DST: a 23h/25h day auto-closes at the correct local midnight.

## 10. Acceptance Criteria

- [ ] A real day planned from the pool in < 3 minutes on the phone.
- [ ] Each of the four responses executed on a real block in ≤ 2 taps; Skip undo works.
- [ ] A deliberately ignored block produces the recovery screen (not a red badge) at next open; "Skip all" resolves it in one tap.
- [ ] After 2 simulated absent days, bulk archive lands on a clean today.
- [ ] State machine unit tests cover every legal transition, every illegal transition rejection, auto-close, and DST boundaries.
- [ ] Full event trail verified for a day that includes a start, a completion, a defer, a skip, and an auto-close.
- [ ] No aggregate numbers, no judgment vocabulary, no red on any M3 screen.
- [ ] The user has run ≥ 3 real days through the system, including ≥ 1 genuine miss and recovery (M3 approval gate).

## 11. Analytics / Observability Requirements

Events as §7. Queryable (SQL only, no UI): planned-start vs. actual-start gap; response mix (start/defer/move/skip) by part of day; recovery latency after misses. These are the validation period's raw material — deliberately invisible in the product until M5 decides how to frame them.

## 12. Out of Scope

Reviews and carry-forward (M4); any visible statistics (M5); notifications (Layer 3); drag-and-drop polish beyond what Phase 5's design specifies as necessary; "energy" prompts of any kind (M5).

## 13. Dependencies

M2 (pool and blocks exist). Phase 5 design proposal informs the execution view's layout, but M3 does not block on visual polish — interaction correctness first.

## 14. Risks and Open Questions

- **Risk (the central one):** the view isn't opened at heavy moments. M3 can't fix this by itself — but it can lose it, via any friction or judgment leak. Every review of this milestone should ask "what here could make him not want to open it?"
- **Risk:** auto-close at midnight feels like the system judging silently. Mitigation: the daily review (M4) phrases auto-closed blocks identically to chosen skips.
- **Open question:** should "why this day" show the linked weekly goal (requires goal-linking at scheduling, +1 decision at planning) or just category? Start with optional goal link; drop if planning friction shows.
- **Open question:** exact-time blocks — do they deserve a "time passed" distinction from part-of-day blocks in the recovery screen? Phase 5 design decides the presentation; the data model already distinguishes them.

## 15. Definition of Done

All acceptance criteria checked including the 3-real-days trial; state-machine module fully unit-tested; Playwright covers plan-day → start → done and ignore → recover → skip-all; deployed to production; M3 approval given.
