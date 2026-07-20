# Phase 3: Milestone-Based Delivery Plan

Status: Draft for approval — Gate 3 of 7
Depends on: `phase_1_need_interpretation.md` (approved), `phase_2_scope_and_stack.md` (approved, free-services-only constraint added)

---

## Structure and rationale

Six milestones instead of the five suggested in the planning prompt. The deviation and its reason:

The suggested structure puts **reviews and insights in one milestone**. Phase 2's layering deliberately separates them: reviews complete the MVP ("Start Loop"), and a **lived validation period of 3–4 real weeks** must sit between the MVP and any measurement features, because the insights layer is only worth building if the MVP's data turns out honest and the loop is actually used. Collapsing them into one milestone would erase the most important gate in the plan. So:

| # | Milestone | Layer | PRD file |
|---|---|---|---|
| M1 | Foundation and Authentication | — | `PRD_01_Foundation_and_Authentication.md` |
| M2 | Block Library and Weekly Planning | 1 | `PRD_02_Weekly_Planning_Core.md` |
| M3 | Daily Scheduling, Execution, and Recovery | 1 | `PRD_03_Daily_Execution_and_Block_Management.md` |
| M4 | Daily and Weekly Reviews, Goal Carry-Forward | 1 | `PRD_04_Reviews_and_Goal_Continuity.md` |
| — | **Live validation period (3–4 weeks of real use — no development)** | gate | — |
| M5 | The Mirror: Rest, Energy, Insights, Re-entry | 2 | `PRD_05_Mirror_Rest_Energy_Insights.md` |
| M6 | Calendar Export and Data Portability | 2 | `PRD_06_Calendar_and_Data_Portability.md` |

Every milestone ends with a deploy to production — from M1 onward there is always a working app at a URL, and each milestone is validated by *using* it, not just by tests passing.

---

## M1: Foundation and Authentication

**Objective:** a deployed, secured, empty-but-alive application: repo, CI, production environment, database with migrations, login, and the app shell (navigation, mobile/desktop layouts).

**User value:** the user can sign in from phone and laptop and land on an empty "this week" screen. Small, but it proves the entire pipeline end-to-end and establishes the daily-deploy rhythm.

**Dependencies:** Vercel account, Neon account, GitHub repo (all free tier). Nothing else.

**Acceptance criteria:**
- App reachable over HTTPS at a stable URL; unauthenticated visits see only the login screen.
- Login with username + password (argon2-hashed) establishes a persistent session (httpOnly cookie, ≥30-day rolling expiry) that survives browser restarts on both phone and desktop.
- Failed logins are rate-limited; no account-creation flow exists.
- Schema migrations run via drizzle-kit against Neon; a `user` table exists and seeding the single user is scripted.
- CI runs typecheck, lint, and unit tests on every push; merge to `main` auto-deploys to production.
- Neon point-in-time restore verified once by actually restoring a branch.

**Main risks:** free-tier friction (Neon cold starts adding latency to first request of the day — must be measured here, while the app is trivial); session handling subtleties on iOS Safari (cookie persistence in home-screen web apps).

**Approval before M2:** you have logged in from your phone and your computer and the shell feels acceptable to navigate.

---

## M2: Block Library and Weekly Planning

**Objective:** the planning half of the loop — define reusable blocks, set up a week with up to 3 goals, and build the week's pool.

**User value:** the user can express a realistic week: goals visible, a bounded pool of intended blocks drawn from a curated library. Planning is fast because blocks are reused, not authored fresh.

**Dependencies:** M1.

**Acceptance criteria:**
- Library: create/edit/archive block templates with name, category (work / family / personal / health / rest), default duration, expected outcome, first action.
- Week: created on first visit for the current calendar week; holds 0–3 goals; goals editable through the week.
- Pool: add blocks to the current week from the library (or as one-offs), remove them, see them grouped by category; pool shows a load signal (total planned hours) without blocking anything.
- A full weekly planning session (3 goals + a realistic pool) completes in under 10 minutes on desktop and is workable on the phone.
- All state changes recorded in the `events` table from the start.

**Main risks:** over-designing the library (it must stay a small curated set, not a task manager); the "planning fast by design" principle failing in practice — measured directly by timing the planning session.

**Approval before M3:** you have planned a real upcoming week with your actual commitments and the vocabulary (library / pool / goals) matches how you think.

---

## M3: Daily Scheduling, Execution, and Recovery

**Objective:** the heart of the product — place pool blocks onto days, and the mobile execution view with the four bounded responses plus the no-shame recovery flow.

**User value:** this is where the product either works or doesn't: the execution moment stops asking questions. The user opens the phone, sees the current block with its full pre-decided context, and taps one of four options.

**Dependencies:** M2 (there must be a planned week to schedule).

**Acceptance criteria:**
- Day view: assign pool blocks to a day and part-of-day (morning / afternoon / evening), optional exact start time; reorder within a day; move between days in ≤2 taps/clicks.
- Execution view (phone-first): shows current/next block with what, expected outcome, duration, why-this-day, first action; exactly four responses — Start / Defer to later today / Move to another day / Skip — each ≤2 taps total; Start leads to a Done / Stopped-early close-out.
- Recovery: opening the app after a block's window passed shows one neutral screen with the same four options; unresolved blocks auto-close as "not completed" at day end; after multi-day absence, one-tap bulk-archive of missed days, no backfilling.
- Full block state machine implemented and unit-tested: every transition preserved in `events`; nothing is ever deleted by a state change.
- No red styling, no "overdue," no counts of missed items anywhere.

**Main risks:** the central product risk lives here — if this view doesn't earn its place in the actual moment of heaviness, the product fails (that's what the validation period after M4 measures); UI complexity of scheduling interactions on mobile.

**Approval before M4:** you have run at least 3 real days through it — planned in the morning (or evening before), responded to blocks from your phone, experienced at least one miss and its recovery.

---

## M4: Daily and Weekly Reviews, Goal Carry-Forward — *completes the MVP*

**Objective:** close the loop: the one-minute auto-derived daily review, the weekly review, and the three-goals carry-forward that gives weeks memory.

**User value:** the day ends with a neutral picture instead of a verdict; the week ends with learning and three goals that *appear* in next week's planning instead of evaporating.

**Dependencies:** M3 (reviews are derived from block states).

**Acceptance criteria:**
- Daily review: auto-derived summary (completed / not completed / deferred / moved — approved vocabulary only), one-tap confirm, optional single free-text line; completable in under 60 seconds; skippable with no trace, no streak, no reminder.
- Weekly review: week's outcomes grouped by goal and category; three prompts (what worked / what was heavy / what should change *in planning*); ends by setting next week's ≤3 goals with the outgoing week's goals displayed alongside.
- Next week's planning screen (M2) shows the carried goals and the review's "what should change" note as context.
- Week rollover logic (timezone-correct, week-start day configurable once) unit-tested.

**Main risks:** reviews are themselves avoidable tasks at the day's lowest-energy moment — if the daily review exceeds a minute it will die; derivation quality (if the summary feels wrong, trust in the mirror dies early).

**Approval before M5 — the big gate:** the **live validation period**: 3–4 consecutive real weeks of use, then a joint review of the Phase 2 validation questions — was the execution view used at execution moments; parts-of-day vs. exact times; sustainable volume; review survival; recovery-flow use. **M5's scope must be re-confirmed or revised based on these answers before any M5 work begins.** If the loop wasn't used, we change the loop, not add features.

---

## M5: The Mirror — Rest, Energy, Insights, Re-entry

**Objective:** the accurate, non-judgmental witness: rest and screen-free blocks as first-class commitments, optional one-tap energy/resistance observations, the forward-framed insights view, the avoidance-logging experiment, and re-entry polish.

**User value:** the system can now contradict the inner critic with data, legitimize rest as a kept commitment, and teach which activities restore versus drain.

**Dependencies:** M4 + validation period conclusions (which may rescope this milestone).

**Acceptance criteria:**
- Rest/screen-free blocks plannable and counted as commitments kept; post-rest one-tap "restorative / not restorative" observation, skippable.
- Optional close-out observations: starting-heaviness (light/medium/heavy) and energy-after (better/same/worse); skipping untracked and consequence-free.
- Insights view reachable from weekly planning only: 3–5 pattern statements phrased as planning input, derived from `events`; zero grades, zero percentages on any home/day screen.
- "Escape happened" one-tap logger, zero follow-up questions, labeled in-product as an experiment with a built-in off switch.
- Re-entry: after any absence, the app opens to today with one neutral line; nothing asks about the gap.

**Main risks:** this milestone is where the app most easily becomes the externalized inner critic — every insight's phrasing needs review against the vocabulary constraint; observation prompts adding friction that degrades core-loop logging (watch for logging drop-off).

**Approval before M6:** 2+ weeks of use with M5 features; energy observations are being used (or consciously dropped); insights read as helpful, not as judgment.

---

## M6: Calendar Export and Data Portability

**Objective:** connect the system to the user's real calendar and make his data permanently safe and portable.

**User value:** scheduled blocks visible in Google/Apple Calendar alongside real-world obligations; complete confidence that the data can never be lost or trapped.

**Dependencies:** M3 (scheduled blocks exist); independent of M5, could run in parallel after the validation period if desired.

**Acceptance criteria:**
- Private ICS feed URL (long random token, revocable/regenerable from settings) serving scheduled blocks; verified subscribed in Google Calendar and Apple Calendar; blocks with exact times appear timed, part-of-day blocks appear as reasonable timed placeholders or all-day entries (decided in PRD).
- In-UI "Export my data" produces a complete JSON of all entities and events.
- Nightly snapshot job (Vercel cron, free tier) writes the same JSON export to storage; restore-from-snapshot procedure documented and tested once for real.
- Feed contains no sensitive free-text beyond block names (review at PRD stage what the calendar should show).

**Main risks:** ICS refresh latency in Google Calendar (hours — must be an accepted limitation, stated up front); token URL leakage (mitigated by revocation and by keeping feed content minimal).

**Approval after M6:** closes Layer 2. Any Layer 3 work (adaptive suggestions, notifications, two-way sync) gets its own proposal and PRD — nothing is pre-approved.

---

## Cross-milestone rules

- **Bilingual from the foundation (added at Gate 6):** the app ships in Hebrew and English, selectable at login and in settings. Every milestone's UI strings go through the typed bilingual catalog — no hardcoded strings, ever; RTL rendering is verified on every new screen as part of that milestone's acceptance; and the user reviews the **Hebrew** copy of each milestone's key screens, since the non-judgmental vocabulary must be right in the language he will actually live in.
- **The vocabulary constraint is a standing acceptance criterion for every milestone.** Any UI copy, empty state, or derived summary using judgment language ("failed," "overdue," "behind," "streak") is a bug.
- **Nothing is deleted by state changes**; every transition appends to `events`. Editing/archiving library templates never rewrites history.
- **Each milestone ships to production and is validated by use**, not only by its test suite.
- **Scope changes mid-milestone go into the next milestone's PRD**, not into the current build — the product about avoiding grandiose plans should be built without them.

---

*Awaiting approval of the milestone plan (Gate 3). On approval I'll write the six PRDs (Gate 4).*
