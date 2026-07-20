# PRD 05: The Mirror — Rest, Energy, Insights, Re-entry

Milestone: M5 · Layer: 2 · Status: Draft for Gate 4 approval
**Conditional:** this PRD's scope must be re-confirmed or revised against the validation period's findings before work begins (M4 gate). Written now as the plan of record; expected to change at the edges.

## 1. Milestone Objective

Add the witness: rest and screen-free blocks as first-class commitments, optional one-tap energy and resistance observations, a forward-framed insights view that turns history into planning input, the avoidance-logging experiment, and re-entry polish after absence.

## 2. User Problem Addressed

Three needs the MVP records but doesn't yet serve: distinguishing restorative rest from avoidance (brief §6), learning which activities improve or reduce energy (brief §7.9), and getting "an accurate picture of actual behavior rather than the story told by the inner critic" (brief §7.14). Plus the re-entry moment — recovering the *relationship with the app* after absence, which the validation period will likely show matters as much as recovering within a day.

## 3. Scope

- Rest/screen-free blocks: full first-class treatment in reviews; post-rest restorative observation.
- Close-out observations: starting-heaviness and energy-after, one tap each, strictly optional.
- Insights view: 3–5 derived pattern statements, reachable from weekly planning only.
- "Escape happened" logger — shipped explicitly as a removable experiment.
- Re-entry polish (extends M3's absence flow with tone and simplicity refinements from validation learnings).

## 4. User Stories

- As the user, I want planned rest to count as a commitment kept, so rest stops being the guilty residue between tasks and becomes something I can succeed at.
- As the user, after resting I want one tap to record whether it actually restored me, so over weeks I learn which rest is real and which is numbing.
- As the user, when a block feels heavy to start, I want the option — never the obligation — to record that heaviness, so patterns of resistance become visible to my planning self.
- As the user, when I plan a week I want the system to hand me 3–5 things it noticed, phrased as planning suggestions, so last month's behavior improves next week's plan without ever grading me.
- As the user, mid-escape, I want a single button that says "escape happened" and asks nothing else, so noticing costs nothing and shaming is structurally impossible.

## 5. Functional Requirements

**Rest first-class**
- FR-1: `rest` category blocks (and a new `screen_free` flag on any block) count in reviews as commitments kept when completed, with equal visual weight to work blocks.
- FR-2: Closing a rest block offers one optional tap: "restorative / not really" (approved phrasing to be finalized in design). Skippable, skip untracked.

**Observations**
- FR-3: Any block's close-out offers two optional one-tap scales: starting felt (light / medium / heavy); energy after (better / same / worse). Both skippable; skipping is untracked and un-nagged; the buttons never become required.
- FR-4: Observations are stored as events, never shown on the block, the day, or any review of the same week — they surface only through insights (≥ 1 week of distance).

**Insights**
- FR-5: Insights view reachable from the weekly-planning screen only ("before you plan — three things from your data"). Not from home, not from Today, no badge, no unread state.
- FR-6: Content: 3–5 statements derived from `events`, each phrased as *observation + optional planning suggestion* ("Evening blocks were moved or not completed in 3 of the last 4 weeks — consider planning lighter evenings"). Statement templates are hand-written; the system fills parameters. No free-form generated text in v1 of insights.
- FR-7: Insight categories in v1: part-of-day patterns, duration patterns (start rates by block length), category balance (planned vs. completed hours), rest restoration ratio, goal-lineage longevity ("this goal is in week 4 — smaller blocks?"). Each category ships with its bad-week phrasing reviewed.
- FR-8: Every insight has a "not useful" dismissal that suppresses that template for a month — the user curates his own mirror.
- FR-9: Hard constraints, restated as requirements: no percentages styled as scores, no week-over-week "better/worse" framing, no insight ever references the user (patterns belong to *blocks and weeks*, grammatically: "evening blocks were moved," never "you avoided evenings").

**Escape logger (experiment)**
- FR-10: A small "escape happened" button on Today. One tap → recorded with timestamp → brief neutral acknowledgment → nothing else. No follow-up questions, no daily count visible.
- FR-11: Escape events appear only in insights (frequency/time-of-day pattern) and only if ≥ 5 events exist in the window.
- FR-12: Settings contains "turn this experiment off," which hides the button and excludes the data from insights. The feature's experimental status is stated in-product.

**Re-entry**
- FR-13: The M3 absence flow refined per validation findings; requirement here: after any absence the first screen is today-focused, one neutral sentence, one optional tap to archive the gap; total ≤ 2 taps to be fully "back."

## 6. Non-Functional Requirements

- Observations must add zero taps to the close-out happy path (Done remains one tap; observations are adjacent, not interposed).
- Insights derivation runs at page load in < 1s for a year of data (thousands of events — trivially indexable; verify anyway).
- All insight templates and their parameter ranges live in one reviewed module (`insights/templates.ts`) — the vocabulary audit has one place to look.

## 7. Data Model Changes

- `block` extended: screen_free (boolean).
- New events: `rest_observation` (restorative|not), `start_heaviness` (light|medium|heavy), `energy_after` (better|same|worse), `escape_logged`, `insight_dismissed` (template_id, until_date).
- New table `insight_dismissal` — template_id, suppressed_until. (Everything else derived on read; no stored insight rows.)

## 8. Main User Flows

1. **Close-out with observation:** tap Done → card flips to "noted" state showing the two optional scales for ~4s (or until navigation) → tap or ignore.
2. **Weekly planning with mirror:** This Week → "three things from your data" panel above the goal slots → read, maybe dismiss one → plan with it in view.
3. **Mid-escape:** phone in hand, scrolling → open app → tap "escape happened" → acknowledgment → the current block is right there, one tap from Start — the logger doubles as a re-entry ramp, which is its real theory of value.
4. **Return after 10 days:** open app → "Welcome back — here's today" → optional archive tap → today is clean.

## 9. Edge Cases

- Sparse data (observations mostly skipped) → insights fall back to the always-computable templates (part-of-day, duration); never "not enough data, log more!" (that's a demand).
- All insights dismissed → panel shows nothing; planning screen reclaims the space. Absence of insights is a valid steady state.
- Contradictory data (a block type both restorative and heavy) → templates report only patterns above simple thresholds; no reconciliation cleverness in v1.
- Escape button pressed 15× in an hour → recorded; acknowledgment unchanged; no rate commentary (the temptation to say "again?" is exactly the judgment leak).
- Validation period may have shown the daily review died (PRD 04 risk) → the morning-fold-in fallback lands here as a scope revision, not in M4 retroactively.

## 10. Acceptance Criteria

- [ ] A completed rest block appears in daily/weekly reviews with weight equal to work blocks; restorative observation recorded via one tap.
- [ ] Done-path tap count unchanged from M3 (regression-tested); observations recordable and skippable; skips leave no event.
- [ ] Insights panel shows only hand-written-template output; audit of every template × bad-week parameters signed off against FR-9.
- [ ] Dismissal suppresses a template for a month; all-dismissed renders an empty (not pleading) panel.
- [ ] Escape logger: log, acknowledgment, off-switch, and insights-only surfacing all verified; no count visible anywhere outside insights.
- [ ] 2+ weeks of real use: observation usage reviewed (used or consciously dropped), insights judged helpful-not-judging by the user (M5 approval gate).

## 11. Analytics / Observability Requirements

New events as §7. Meta-question the events must answer: *is the mirror being looked at?* — insights-panel views per planning session, observation opt-in rate over time, escape-logger usage curve (novelty spike then abandonment would argue for removal).

## 12. Out of Scope

Adaptive planning suggestions (Layer 3 — insights *inform*, they never *draft the week*); mood/mental-health framing of any kind (brief §12); charts and graphs (v1 insights are sentences, not visualizations — a chart invites score-reading); week-over-week comparisons; notifications.

## 13. Dependencies

M4 + the validation period's written findings (hard gate). Independent of M6.

## 14. Risks and Open Questions

- **Risk (dominant):** this milestone is where the app most easily becomes the externalized inner critic. Structural mitigations: insights only at planning time, grammar rule (blocks, not "you"), hand-written templates, dismissals, sentences not charts. The user's felt sense at the M5 gate is the real test.
- **Risk:** observation prompts erode close-out logging (friction creep). Mitigation: zero-added-taps NFR + watching logging rates before/after M5 deploy.
- **Open question:** is the escape logger's real value the log or the re-entry ramp (flow 3)? The usage curve will say; if it's the ramp, a future version might drop the logging and keep the door.
- **Open question:** exact phrasings ("restorative / not really," heaviness scale labels) — Phase 5 design + native-language sensibility; flagged for the user's ear specifically.

## 15. Definition of Done

All acceptance criteria checked including the 2-week live trial; template audit documented in the repo; observation/insight modules unit-tested; deployed; M5 approval given.
