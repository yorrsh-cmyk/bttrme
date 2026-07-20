# PRD 02: Weekly Planning Core — Block Library and Week Pool

Milestone: M2 · Layer: 1 (MVP) · Status: Draft for Gate 4 approval

## 1. Milestone Objective

The planning half of the loop: a curated library of reusable block templates, weeks with up to three goals, and the week pool built by pulling from the library. Planning a realistic week takes minutes, not an hour.

## 2. User Problem Addressed

Cognitive overload at planning time ("planning requires too many decisions") and grandiose plans (brief §6). The library means the user decides *once* what kinds of actions exist in his life — with duration, expected outcome, and first action pre-attached — and each week is composed, not authored. The 3-goal cap and the pool's load signal resist the overly ambitious week before it begins (brief assumption #9).

## 3. Scope

- Block template CRUD (create, edit, archive — never hard delete).
- Week entity auto-created for the current week; up to 3 weekly goals per week.
- Week pool: add blocks from the library or as one-offs; remove; view grouped by category; load signal.
- This Week screen becomes real (goals + pool); Library screen becomes real.
- Every state change written to `events`.

Not in scope here: placing blocks on days (M3), reviews and goal carry-forward (M4 — in M2, goals are typed manually each week).

## 4. User Stories

- As the user, when I plan a week I want to see clearly what truly matters this week, so I don't create an impossible list (brief JTBD 1) — I set at most three goals and they stay on screen while I build the pool.
- As the user, I want to build my week from a defined pool of known action types, so a planning session is selection, not invention.
- As the user, I want the system to show me the week's total load while I plan, so an overloaded week is visible before it starts — without the system forbidding it (autonomy principle: the system caps, the user overrides).
- As the user, I want rest to be a block type I can plan like anything else, so free time has shape before screens absorb it. (Rest blocks are *plannable* from M2; their first-class treatment in reviews/insights arrives in M5.)

## 5. Functional Requirements

- FR-1: Block template fields — name (required), category (`work` | `family` | `personal` | `health` | `rest`, required), default duration in minutes (required), expected outcome (short text, required), first action (short text, required), notes (optional). Required-ness of outcome and first action is deliberate: it front-loads the execution moment's questions.
- FR-2: Templates can be archived; archived templates disappear from the picker but remain referenced by historical blocks.
- FR-3: A week is identified by its start date (per the user's week-start setting); visiting This Week materializes the week row if absent.
- FR-4: Weekly goals — 0 to 3 per week, free text (≤ ~120 chars); the UI provides exactly 3 slots, no "add more" affordance. Editable all week.
- FR-5: Adding a library block to the pool creates a **block** (an instance) copying the template's fields; the copy is thereafter independent (editing a template never rewrites existing weeks). One-off blocks are created inline with the same required fields.
- FR-6: A block in the pool can be edited (all fields), or removed (state `removed`, kept in history, hidden from UI).
- FR-7: Pool view groups by category and shows the load signal: total planned hours vs. a soft reference line; exceeding it changes the message ("this is a heavy week") — vocabulary-compliant, never blocking.
- FR-8: The same template can be added multiple times (e.g., three "Deep work" blocks).
- FR-9: All mutations append typed events: `template_created/edited/archived`, `week_created`, `goal_set/edited/cleared`, `block_added_to_pool`, `block_edited`, `block_removed`.

## 6. Non-Functional Requirements

- Weekly planning session (3 goals + 8–15 blocks) completable in **< 10 minutes on desktop**, and workable (slower is acceptable) on the phone.
- Adding a block from the library: ≤ 3 interactions (open picker → tap template → confirm/adjust).
- All copy passes the vocabulary constraint (no "overdue," "behind," "failed," "productivity").
- Load signal reference is configurable in settings (default ~20 planned hours/week of non-rest blocks — a starting guess, expected to be tuned during validation).

## 7. Data Model Changes

New tables:

- `block_template` — id, name, category, default_duration_min, expected_outcome, first_action, notes, archived_at, created_at.
- `week` — id, start_date (date, unique), created_at.
- `weekly_goal` — id, week_id, position (1–3), text, created_at, updated_at. (M4 adds carry-forward fields.)
- `block` — id, week_id, template_id (nullable for one-offs), name, category, duration_min, expected_outcome, first_action, notes, status (`pool` | `removed` for now; M3 extends), created_at. Template fields are **copied**, not referenced, to keep history immutable.

## 8. Main User Flows

1. **Curate library (occasional):** Library → add template → fill five fields → save. Expected library size: 10–25 templates, not hundreds.
2. **Plan a week:** This Week → type up to 3 goals → open library picker → tap templates to add (adjust duration/outcome inline if needed) → watch load signal → done. No "finish planning" ceremony; the pool is simply ready.
3. **Adjust mid-week:** add or remove pool blocks anytime; changes are events, not resets.

## 9. Edge Cases

- Week boundary: user plans Sunday evening for the coming week → This Week must offer "next week" from (week-start − 2 days) onward, defaulting sensibly. (Design decision for Phase 5; requirement: planning the *next* week is possible before it starts.)
- Empty library on first use → the picker's empty state invites creating the first template inline; no pre-seeded "sample" templates that would impose someone else's life categories. Exception: 2–3 rest-category starter templates, since rest-as-block is a product concept the user shouldn't have to invent.
- Editing a pool block copied from a template does not offer "update template too" (avoids a decision; template editing lives in Library).
- A week with 0 goals is valid — goals are an aid, not a gate.
- Duplicate template names allowed (categories disambiguate); no uniqueness errors to negotiate with.

## 10. Acceptance Criteria

- [ ] User creates his real library (own categories of life) and plans a real upcoming week — 3 goals + realistic pool — in under 10 minutes at a desktop.
- [ ] Same flow completable on the phone.
- [ ] Archiving a template hides it from pickers; historical weeks are unaffected.
- [ ] Load signal appears and changes message at the threshold; nothing is ever blocked.
- [ ] Removing a pool block leaves no visible trace in the pool but a queryable event in `events`.
- [ ] All listed event types verified present in `events` after an end-to-end planning session.
- [ ] Zero judgment vocabulary anywhere (reviewed against the approved word list).

## 11. Analytics / Observability Requirements

Events as FR-9. Derived metric available by SQL (no UI yet): time-to-plan (first to last planning event per session), pool size per week, planned hours per category — these feed the validation period after M4.

## 12. Out of Scope

- Scheduling blocks to days (M3). Goal carry-forward and reviews (M4). Insights (M5). Drag-and-drop niceties beyond basic add/remove (Phase 5 design decides interactions; M2 may ship with tap-based picker only).

## 13. Dependencies

M1 complete (auth, shell, migrations, events table).

## 14. Risks and Open Questions

- **Risk:** the library quietly becomes a task manager (one-off "templates" for single errands). Mitigation: one-off blocks are deliberately easy to create *in the pool*, keeping the library for genuinely recurring action types.
- **Risk:** five required fields per template feels heavy at library-creation time. Accepted cost: it is paid once per template, at a calm moment, to make every future execution moment cheaper. Watch it during M2 approval.
- **Open question:** default load-signal threshold — 20h of non-rest blocks is a guess; tune with real data.
- **Open question:** should goals optionally link to blocks ("this block serves goal 2")? Deferred to M4, where the weekly review would consume that link; adding it in M2 only if it costs nothing in planning friction.

## 15. Definition of Done

All acceptance criteria checked; the user has planned a real week and confirms the vocabulary (library / pool / goals) matches how he thinks (M2 approval gate); unit tests cover week materialization, the 3-goal cap, template copy semantics, and event emission; deployed to production.
