# PRD 04: Daily and Weekly Reviews, Goal Carry-Forward

Milestone: M4 · Layer: 1 (completes the MVP) · Status: Draft for Gate 4 approval

## 1. Milestone Objective

Close the loop: a sub-minute auto-derived daily review, a weekly review that turns the week into learning, and the three-goals carry-forward that gives weeks memory. M4 completes the MVP; the 3–4 week live validation period follows it.

## 2. User Problem Addressed

The verdict step of the behavioral loop ("afterwards, the first system returns as a judge") and the lack of continuity between weeks (brief §6: "goals and insights tend to disappear from one week to the next"). The daily review replaces the inner critic's story with a neutral factual picture; the weekly review converts the week into planning adjustments rather than identity conclusions; carry-forward makes next week begin from what was learned instead of from zero. Serves brief JTBD 6 in full.

## 3. Scope

- Daily review: auto-derived summary, one-tap confirm, optional one-line note, skippable without trace.
- Weekly review: outcomes grouped by goal and category; three reflection prompts; set next week's goals with carry-forward.
- Carried goals + "what should change" note surfaced in next week's planning screen (extends M2).
- Week rollover logic hardened (timezone, week-start setting).

## 4. User Stories

- As the user, at day's end I want a 30-second neutral picture of what happened — completed, not completed, deferred, moved — so the day closes with facts instead of a verdict.
- As the user, at week's end I want to see what I completed, what I avoided, what was overly ambitious, and which goals deserve another week — phrased as information about *planning and behavior*, not about me (brief JTBD 6).
- As the user, when I plan a new week I want last week's three goals and my own "what should change" note in front of me, so each week continues a thread instead of starting a new story.
- As the user, I want to be able to skip any review with zero consequence, so the reviews themselves never become another test I can fail.

## 5. Functional Requirements

**Daily review**
- FR-1: Available from day end (configurable hour, default 20:00) until replaced by the next day's; reachable from Today at any time after that hour.
- FR-2: Content is fully derived from block states — completed / completed partially / not completed / deferred / moved — listed per block in approved vocabulary. Auto-closed and chosen-skip blocks are phrased identically.
- FR-3: One optional free-text line ("anything worth noting?" — one field, not a form). Confirming = one tap. Total interaction ≤ 60 seconds.
- FR-4: Skipping is untracked: no streak, no "you missed 3 reviews," no reminder, no visual debt. A skipped review simply doesn't exist; the underlying block data is unaffected.
- FR-5: A confirmed review is editable until the next day ends, then frozen.

**Weekly review**
- FR-6: Available from the last day of the week (per week-start setting) through the first day of the next; late completion allowed anytime (reviewing week N from week N+2 is fine — better late data than a gap).
- FR-7: Shows, per weekly goal: its linked blocks' outcomes (if goal-linking was used) — and per category: planned vs. completed hours, plus notable facts stated neutrally ("4 blocks moved out of Tuesday evening"). No percentages presented as scores; facts, not grades.
- FR-8: Also lists blocks "planned but never scheduled" (expired in pool) — the overload signal in hindsight.
- FR-9: Three reflection prompts, each one optional short text: *What worked? What was heavy? What should change in planning?* The third prompt's answer is stored as the week's "planning note."
- FR-10: Final step: set next week's goals. Each of last week's goals is shown with three choices — **carry** (copies text, records lineage), **rephrase and carry**, or **let go** (neutral wording; not "abandon"/"failed"). Plus empty slots for new goals; cap of 3 total enforced by the same 3-slot UI.
- FR-11: Completing the weekly review materializes next week with its goals; skipping it leaves next week's planning to start goals-from-scratch (M2 behavior) with last week's goals still shown as reference.

**Planning-screen integration (extends M2)**
- FR-12: This Week planning shows: carried goals (with lineage marker), last week's planning note, and — nothing else from history. The past enters planning only as the user's own words and choices.

## 6. Non-Functional Requirements

- Daily review: ≤ 60s real interaction, measured in use.
- Weekly review: ≤ 10 minutes, designed for desktop, workable on phone.
- Review derivation is pure-function over block/event data (unit-testable, deterministic, re-derivable if a bug is found later).
- Vocabulary constraint applies to derived text most strictly of all — this is the screen where a judgment leak does the most damage.

## 7. Data Model Changes

- `daily_review` — id, date (unique), confirmed_at, note (nullable). (Contents derived, not stored — only the confirmation and note.)
- `weekly_review` — id, week_id (unique), completed_at, what_worked, what_was_heavy, planning_note (all nullable text).
- `weekly_goal` extended: carried_from_goal_id (nullable), outcome (`carried | rephrased | let_go`, nullable — set by the *next* review's carry-forward step).
- New events: `daily_review_confirmed`, `weekly_review_completed`, `goal_carried`, `goal_rephrased`, `goal_let_go`.

## 8. Main User Flows

1. **End of day:** open app after 20:00 → Today offers "Close the day" → derived list → optional line → confirm. Done in under a minute.
2. **End of week:** weekend → "Review the week" from This Week → facts per goal/category → three prompts → goal carry-forward (three taps + maybe some typing) → next week exists with goals set.
3. **Skip everything for a week:** no reviews confirmed → next This Week visit shows last week's goals as reference and plans from scratch. No mention of the skipped reviews. Ever.

## 9. Edge Cases

- Week with zero blocks (user absent all week) → weekly review still available, shows the absence as one neutral sentence, carry-forward works — this is exactly the "return after a bad week" moment; it must be the *gentlest* screen in the product.
- Daily review confirmed, then a block is edited (late close-out via FR-7 of PRD 03) → review content re-derives; the note is preserved.
- Two unreviewed weeks → only the most recent week gets the full review flow; older weeks are reachable read-only (no guilt queue of pending reviews).
- Goal carried three+ weeks running → allowed; lineage chain preserved; whether to surface "this goal is on week 4" is an M5 insights decision, not visible here.
- User completes weekly review, then edits this week's remaining days → fine; review snapshot text was derived at completion time and marked as such.

## 10. Acceptance Criteria

- [ ] Daily review completed on a real day in < 60s; skipped the next day with zero visible consequence anywhere in the UI.
- [ ] Weekly review completed on a real week including one carried, one rephrased, and one let-go goal; next week's planning screen shows the carried goals with lineage and the planning note.
- [ ] The zero-block-week review verified gentle (screenshot review against vocabulary + no-verdict constraints).
- [ ] Derivation functions unit-tested including partial completions, auto-closes, moved-block chains, and the re-derivation-after-edit case.
- [ ] Rollover tested across a real weekend with the user's actual week-start setting.
- [ ] MVP end-to-end Playwright flow green: plan week → schedule days → execute variously → daily review → weekly review → goals appear next week.

## 11. Analytics / Observability Requirements

Events as §7. This completes the dataset for the validation period, whose questions (from Phase 2) are answerable by SQL over `events`: execution-view usage at execution moments, parts-of-day vs. exact-time usage, review completion and duration, recovery-flow usage, volume sustainability.

## 12. Out of Scope

Insights UI, energy/resistance observations, restorative-rest tracking (all M5); any cross-week statistics visible in-product; PDF/email summaries; editing historical reviews beyond the freeze rule.

## 13. Dependencies

M3 (block states are the raw material). M4 also touches the M2 planning screen (FR-12).

## 14. Risks and Open Questions

- **Risk:** the daily review dies at the day's lowest-energy moment. The 60-second budget and skippable-without-trace design are the mitigations; the validation period is the test. If it dies, the fallback design is folding the daily picture into the next morning's first app-open (a decision for after validation, not now).
- **Risk:** derived neutral facts still read as verdicts in bad weeks ("0 of 9 completed" is a fact and a knife). Mitigation: absolute counts phrased as lists, not ratios; the zero-week sentence hand-crafted; Gate-6 design review specifically audits the bad-week states.
- **Open question:** default day-end hour (20:00?) and whether the "Close the day" affordance should appear earlier on light days.
- **Open question:** should the weekly review show week-over-week comparison ("2 more blocks completed than last week")? Deferred to M5 — comparison is exactly where judgment sneaks in.

## 15. Definition of Done

All acceptance criteria checked; MVP declared complete and deployed; the validation period formally begins with a written list of the questions it must answer (copied from Phase 2, Layer 1) and where in `events` each answer lives; M4 approval given.
