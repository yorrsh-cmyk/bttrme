# Phase 4: Information Architecture and Product Model

Status: Draft for approval — Gate 5 of 7
Depends on: approved Phases 1–3 and PRDs 01–06 (with Gate 4 decisions: Sunday week start, app name Bttrme, rest blocks exported)

---

## Part A: The Conceptual Model in One Paragraph

Bttrme's world has four layers of permanence. The **library** is slow-changing: the kinds of actions that exist in the user's life, each pre-packaged with everything the execution moment will need. The **week** is the unit of intention: up to three goals plus a pool of blocks drawn from the library. The **day** is the unit of execution: blocks placed into parts of day, moving through a small neutral state machine. And the **event log** is the unit of truth: every transition, observation, and review appended forever, never edited — the raw material from which reviews and insights are *derived* rather than stored. Almost everything the brief lists as a candidate entity turns out to be either a value of `block.category`, a field on `block`, or a pattern in the event log — the model stays small because history lives in one place.

## Part B: Evaluation of the Candidate Entities

The planning prompt lists fourteen candidate entities. Verdict for each:

| Candidate | Verdict | Rationale |
|---|---|---|
| User | **Table** (`user`) | Also carries settings (timezone, Sunday week start, part-of-day windows, load threshold) — a separate settings table for one user is ceremony. |
| Week | **Table** (`week`) | The product's spine; identified by its Sunday start date. |
| Weekly goals | **Table** (`weekly_goal`) | Needs identity for lineage (carry-forward chains) — can't be a text array on `week`. |
| Default block library | **Table** (`block_template`) | Slow-changing curated set; archived, never deleted. |
| Weekly block pool | **Not an entity** — a *view* of `block` where `status = 'pool'` | Pool and scheduled blocks are the same thing at different lifecycle stages; two tables would force a copy at scheduling time and split history. |
| Scheduled block | **Same table** (`block` with `scheduled_date` + `part_of_day`) | As above. |
| Completion state | **Field** (`block.status` + close-out fields) | A state, not a thing. |
| Deferral / rescheduling history | **Event-log pattern** (`block_moved` events) | Storing move history relationally would duplicate the event log — the log *is* the history (PRD 03 FR-3). |
| Rest and recovery blocks | **Category value** (`category = 'rest'`) | Rest is deliberately *not* special-cased structurally — first-class means same table, same states, same weight (PRD 05 FR-1). |
| Screen-free sessions | **Flag** (`block.screen_free`) | Orthogonal to category (a family walk can be screen-free). |
| Daily review | **Thin table** (`daily_review`) | Only confirmation + note are stored; the content is derived (PRD 04 FR-2) — storing derived text would let the record and the truth diverge. |
| Weekly review | **Thin table** (`weekly_review`) | Reflection answers are user-authored (stored); the facts section is derived. |
| Energy / resistance observations | **Events** (`start_heaviness`, `energy_after`, `rest_observation`) | Optional one-tap facts with a timestamp and a block reference — the event log's exact shape; a table would add nothing. |
| Calendar export / sync records | **Table** (`calendar_feed`) + events | Feed config is state; fetches are not tracked (a calendar client polling is not user behavior). |

Supporting tables not on the list: `session`, `login_attempt` (auth infrastructure, PRD 01); `events` (the log itself); `insight_dismissal` (PRD 05); `snapshot_log` (PRD 06).

## Part C: Entity Relationship Model

```
user 1──∞ session
user 1──∞ block_template
user 1──∞ week                        (weeks belong to the one user; kept explicit for export sanity)

week 1──0..3 weekly_goal
week 1──∞ block

block_template 1──∞ block             (nullable: one-off blocks have no template)
weekly_goal 0..1──∞ block             (nullable: "why this day" link, optional)
weekly_goal 0..1──1 weekly_goal       (carried_from_goal_id — lineage chain across weeks)

week 1──0..1 weekly_review
(day) 1──0..1 daily_review            (keyed by date, not a day table — days need no identity beyond their date)

events ∞──(entity_type, entity_id)    (polymorphic append-only reference to any entity)

user 1──0..1 calendar_feed (active)   (revoked rows retained)
insight_dismissal, snapshot_log, login_attempt — standalone
```

Deliberate absences: **no `day` table** (a date is enough; daily structure is derivable from blocks sharing a `scheduled_date`); **no `insight` table** (insights are pure functions over events, plus dismissals); **no separate `pool` or `schedule` tables** (lifecycle stages of `block`).

## Part D: Entities and Important Fields

Consolidated from PRDs 01–06 — this is the authoritative field list; PRDs defer to this document where they differ in detail.

**`user`** — id · username · password_hash (argon2id) · timezone (IANA) · week_start_day (fixed `sun`) · day_end_hour (default 20) · load_threshold_hours (default 20) · morning/afternoon/evening window bounds · created_at

**`block_template`** — id · name · category (`work|family|personal|health|rest`) · default_duration_min · expected_outcome · first_action · notes? · archived_at? · created_at

**`week`** — id · start_date (a Sunday, unique) · created_at

**`weekly_goal`** — id · week_id · position (1–3) · text · carried_from_goal_id? · outcome? (`carried|rephrased|let_go`, written by the *next* week's review) · created_at · updated_at

**`block`** — id · week_id · template_id? · goal_id? · name · category · screen_free (bool) · duration_min · expected_outcome · first_action · notes? · status (`pool|scheduled|active|done|done_partial|not_completed|removed`) · scheduled_date? · part_of_day? (`morning|afternoon|evening`) · start_time? · day_order? · actual_start_at? · actual_end_at? · not_completed_cause? (`chosen|auto`) · created_at
*Template fields are copied at creation — a block is a historical fact, immune to later template edits.*

**`daily_review`** — id · date (unique) · confirmed_at · note?

**`weekly_review`** — id · week_id (unique) · completed_at · what_worked? · what_was_heavy? · planning_note?

**`events`** — id · at · entity_type · entity_id · event_type · payload (jsonb). Append-only: no UPDATE or DELETE, enforced by convention and a CI grep (no ORM update/delete calls against it), not by fragile DB triggers.

**`calendar_feed`** — id · token_hash · detail_level (`minimal|standard`) · created_at · revoked_at?

**`insight_dismissal`** — template_id · suppressed_until    **`snapshot_log`** — id · at · location · size_bytes · status    **`session` / `login_attempt`** — per PRD 01.

## Part E: Lifecycle Rules

**Block** (the one real state machine — full transition table in PRD 03 §5):
- Created into `pool` (from template or one-off) → `scheduled` (gains date + part of day) → `active` (Start) → `done` / `done_partial`.
- `scheduled` → `not_completed` via Skip (`chosen`) or day-end auto-close (`auto`).
- Any pre-`active` state → `removed` (hidden, never deleted). Moves and defers are *not* state changes — they are events that update `scheduled_date`/`part_of_day` while status stays `scheduled`.
- Terminal states (`done`, `done_partial`, `not_completed`) are final except the late-close-out correction window (PRD 03 FR-7), which re-derives any confirmed daily review it touches.
- Pool blocks never auto-carry into the next week: they expire with the week and appear in its review as "planned but never scheduled." Imported debt is the alternative, and it is rejected.

**Week:** materialized on first touch (planning ahead allowed from Friday per PRD 02 §9); never closed or locked — "the week ended" is a fact of dates, not a status. **Weekly goal:** editable during its week; its `outcome` is written once by the following review's carry-forward step; lineage chains are never rewritten. **Daily review:** confirmable from day-end hour; editable until the next day ends; then frozen. **Weekly review:** completable from the week's last day, no deadline; only the most recent unreviewed week gets the full flow (no guilt queue). **Template:** active → archived (reversible); never deleted while referenced. **Calendar feed:** active → revoked (new row replaces it); revoked rows kept. **Session:** rolling 30-day expiry.

## Part F: Editable, Derived, Preserved

**Editable by the user:** templates (future blocks only) · goals (during their week) · pool/scheduled block fields · schedule placement (as recorded moves) · review free-text (within freeze windows) · settings · feed config. Guiding rule: *plans are editable, history is not.*

**Derived, never stored:** daily review content · weekly review facts section · insights · load signal · "today" structure · all validation-period metrics. Guiding rule: *anything the app asserts about behavior must be recomputable from the event log — a stored assertion could drift from the truth and become a false verdict.*

**Preserved forever (the historical record):** every event · every block in any terminal or removed state · goal lineage · review confirmations and notes · revoked feeds · snapshot log. Guiding rule from Phase 1: *history is data, not a shame archive* — preserved completely, surfaced only through the framing rules (silence in the moment, facts at reviews, patterns at planning).

**Deliberately never collected** (brief assumption #14, resolved): raw screen-time or app-usage telemetry · location · device sensors · mood/mental-health scales · anything requiring passive surveillance. The escape logger is the only avoidance-adjacent datum, and it is opt-out, one-tap, and content-free.

## Part G: Retention and Data-Volume Reality

Everything is kept forever by default: a heavy year is ~1,500 blocks and perhaps 15–20k events — a few MB. No pruning machinery is warranted (`login_attempt` rows >24h and expired sessions are the only cleanup, folded into the nightly cron). If a future self wants the record trimmed, that is a product decision about *his own history* and would arrive as an export-then-delete tool, never an automatic expiry. Backups per PRD 06: 30 daily + 12 monthly snapshots.

## Part H: Open Questions Carried to Design (Phase 5)

1. Where exactly the goal-link ("why this day") is offered during scheduling without adding a mandatory decision — the model supports it; the interaction must make it ignorable.
2. Whether `done_partial` ("stopped early") needs its own close-out affordance or lives behind Done — the state exists either way.
3. The visual treatment of the pool→scheduled distinction on the phone — the model's cleanest separation must also be the UI's.

---

*Awaiting approval of the information architecture (Gate 5). On approval I'll build the interactive HTML design proposal (Gate 6).*
