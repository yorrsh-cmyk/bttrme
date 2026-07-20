# Phase 1: Need Interpretation

Source: `need_brief_intention_to_action_en.md`
Status: Draft for approval — Gate 1 of 7

---

## 1. The Core User Problem

The user does not have a planning problem; he has a **starting problem**. Plans, goals, and priorities are produced easily — sometimes too easily. The breakdown is localized to a specific moment: the transition from "I intended to do this now" to "I am doing this now." At that moment, a cluster of experiences fires together (heaviness, low desire, fear the effort will fail, fear that failure proves personal inadequacy, protection of remaining freedom), and the path of least resistance is escape into immediate relief — usually a screen.

Crucially, the cost is not only the unstarted task. It is the **interpretation** that follows: non-completion is read as a character verdict ("lazy, mediocre, a failure"), which raises the perceived stakes of the *next* start, making it harder still. The problem compounds itself.

So the core problem, stated precisely: **each planned action carries hidden negotiation and identity stakes at the moment of execution, and the user has no mechanism to discharge either one.**

## 2. The Behavioral Loop

The brief names it explicitly:

> Aspiration → Planning → Moment of execution → Heaviness and fear → Avoidance → Temporary relief → Numbness and guilt → Self-criticism → New plan → Further avoidance

Three properties of this loop matter for product design:

1. **Planning is inside the loop, not outside it.** A new plan is the loop's *reward* — it restores a temporary sense of control and hope. This means a planning tool can feed the pathology it is meant to treat. The brief flags this itself (assumption 11: "How can the system prevent planning itself from becoming a form of avoidance?").
2. **The loop's engine is interpretation, not behavior.** Avoidance happens to everyone; what regenerates the loop is the verdict step ("I am a failure") which raises the threat level of the next execution moment.
3. **The escape behavior is not restorative.** Screen time reduces tension but produces numbness, not recovery — so the user re-enters the loop with *less* energy, not more.

The product's job is to intervene at three points: **before** the execution moment (remove negotiation by deciding everything in advance), **during** it (offer a small, non-judgmental set of responses to avoidance), and **after** it (replace the verdict with data).

## 3. The Deepest User Needs

Beneath the jobs-to-be-done, I read five needs, roughly in order of depth:

1. **Rebuilt self-trust.** The user's success definition ends with "gradually develops trust in his ability to decide on an action and follow through." Every feature should ultimately serve the accumulation of small kept promises.
2. **Externalized decision-making.** Decide *once*, during planning, everything the execution moment would otherwise demand: what, when, how long, what counts as done, what the first physical action is. The execution moment should require approximately zero decisions.
3. **A non-judgmental witness.** The inner critic tells a distorted story ("you did nothing this week"). The user needs an accurate external record that can contradict it — "you completed 9 of 14 blocks, deferred 3, and recovered within a day both times you missed."
4. **Legitimized rest and preserved autonomy.** Rest must be a planned, first-class activity — otherwise all rest degrades into unplanned escape, and all demands (even self-chosen ones) feel like coercion. The user needs to *see* choice inside his obligations.
5. **Continuity of learning.** Insights and goals currently evaporate between weeks. Three goals carried forward, visible in context, is the minimum viable memory.

## 4. The Main Product Risks

1. **The app becomes the externalized inner critic.** Any chart, streak, score, or completion percentage can be read as a verdict. This is the dominant risk and it is subtle: even neutral data ("started on time: 40%") is a judgment to this user on a bad day. Mitigation is not just tone — it is *what is measured, when it is shown, and whether it is framed as information for next week's planning or as a grade for last week.*
2. **Abandonment after the first bad week.** The failure mode of every productivity tool for this user profile: one week of non-use becomes evidence of failure, and reopening the app means facing the record of that failure. The system must be explicitly designed to be *cheap to return to* — a re-entry path that requires no backfilling, no confrontation with a wall of overdue items, no reset.
3. **Planning becomes the product's most-used feature.** If weekly planning is rich, satisfying, and elaborate, it will absorb the user's energy and become high-grade avoidance. Planning must be deliberately fast and capped.
4. **Logging burden at exactly the wrong moments.** The product needs data (did you start? did avoidance occur? energy before/after) but every data point is requested at a low-energy, high-shame moment. If honest logging costs more than a tap or two, the data will be absent or dishonest, and every downstream insight collapses.
5. **The system only sees what the user reports.** There is no passive sensing. All "behavior" is self-report. The design must make honest reporting of *bad* outcomes (missed, avoided, escaped to screen) as frictionless and consequence-free as reporting good ones.
6. **Overbuilding.** This is a one-user product addressing a deep problem. The temptation is to build the full psychological apparatus (energy tracking, avoidance detection, pattern learning, adaptive suggestions) before validating that the core loop — plan blocks, start blocks, review without judgment — works at all.

## 5. Most Important Assumptions Still Needing Validation

The brief lists fourteen; these five gate the earliest design decisions and should be validated first, through use of the MVP rather than up-front:

1. **Exact times vs. parts of day** (brief #5). This decides the entire scheduling model and calendar integration. My working hypothesis: *parts of day (morning / afternoon / evening) with optional exact times*, because exact times create more opportunities to "fail" (miss the slot → whole plan feels broken), while parts of day preserve the flexibility-within-structure principle. Must be validated by lived use.
2. **How much measurement before measurement becomes judgment** (briefs #3 and #4). Especially screen-escape tracking: it may be the highest-value data or a guilt engine. Hypothesis: make avoidance logging *optional and unpunished* in the MVP, observe whether the user actually uses it.
3. **Volume cap** (brief #2). How many blocks per week/day before the system itself overwhelms? Hypothesis: hard-ish caps (e.g., 3 weekly goals, single-digit blocks per day) with the system flagging — not blocking — overload.
4. **Rigid vs. flexible structure** (brief #1). How much should moving a block cost? Hypothesis: moving is free and one-tap, but recorded.
5. **Planning-as-avoidance guard** (brief #11). Can weekly planning be made fast enough (target: minutes, not an hour) that it can't serve as escape? This constrains the planning UI more than any visual consideration.

## 6. How This Differs From a Conventional Productivity App

| Conventional tool | This product |
|---|---|
| Unit is the *task* (a title on a list) | Unit is the *block*: an action pre-packaged with time, duration, expected outcome, rationale, and first step — everything needed to start without negotiating |
| Success = throughput (more done) | Success = **starting**, returning after misses, and meeting a small number of core commitments |
| Missed item → overdue, red, nagging | Missed item → data point; a defined recovery flow; no accumulating debt |
| Rest is the absence of tasks | Rest is a planned, protected, first-class block type |
| Unlimited list; more capture is better | Deliberately capped; the system resists overload rather than absorbing it |
| History is clutter to archive | History (deferrals, moves, misses) is the primary learning material, preserved non-judgmentally |
| Each week starts blank | Exactly three goals and the week's insights carry forward as visible context |
| Neutral-to-gamified language (streaks, scores, "overdue!") | Constrained vocabulary: completed, not completed, deferred, moved, overloaded, adjustment needed — never lazy, failed, behind |

The one-sentence version: **a conventional tool optimizes what happens between starts; this product optimizes the start itself, and the recovery after a non-start.**

## 7. Principles That Must Hold Through Every Product and Engineering Decision

1. **Non-judgment is a hard constraint, not a tone.** The approved vocabulary (brief §8) applies to UI copy, empty states, notifications, data visualizations, and even variable naming in analytics. No streaks, no red badges, no "overdue," no scores presented as grades.
2. **Front-load every decision.** Anything the execution moment might ask, planning must have already answered. The execution view presents context; it never asks questions beyond tap-level choices.
3. **The interaction cost of reporting a bad outcome must be ≤ the cost of reporting a good one.** Otherwise the data lies.
4. **A miss triggers a recovery flow, never a debt.** Nothing accumulates. There is no backlog view of shame. Returning after absence (an hour, a day, a week) must be one screen and zero backfilling.
5. **The system caps; the user overrides.** Overload warnings are information, not enforcement — preserving autonomy while resisting grandiose plans.
6. **Planning is fast by design.** If a planning session can take an hour, it will. Target minutes.
7. **Measure behavior, present learning.** Data is collected about behavior but surfaced as input to *next week's* planning ("Tuesday evenings blocks were deferred 3 weeks running — plan lighter?"), not as a report card on last week.
8. **Mobile is where the loop lives.** The execution moment, the avoidance moment, and the recovery moment all happen on the phone. Desktop serves weekly planning depth. Same product, two postures.
9. **Proportionality.** One user, one browser login, one database. Every architectural choice must be justifiable for a personal tool.

## 8. Tensions, Contradictions, and Open Questions

These are places where the brief pulls against itself; the design must hold both sides rather than resolve one away:

- **Fewer decisions in the moment ↔ preserve autonomy.** Pre-commitment removes choice; autonomy demands it. Resolution hypothesis: choice is exercised *at planning time* and *within a bounded set* at execution time (start / defer / shorten / swap — never a blank re-plan). Whether a 4-option bounded choice feels like autonomy or coercion is an open question only use can answer.
- **Accurate behavioral mirror ↔ non-judgment.** "Give the user an accurate picture of actual behavior" and "no verdicts" can collide: accurate pictures of bad weeks look like verdicts. The framing (data feeding forward vs. grading backward) carries most of the load here, and it is unproven.
- **History preserved ↔ history as shame archive.** Every move/deferral is recorded as data, but a block that shows "moved 4 times" is a small monument to avoidance. Open question: is repeated-deferral data surfaced immediately, only at weekly review, or only on request?
- **Reviews are the product's backbone ↔ reviews are themselves tasks that can be avoided.** The daily review happens at end of day — the lowest-energy moment. If reviews are missed, do review-completion records become a new failure ledger? Hypothesis: daily review must be under a minute, skippable without trace, and reconstructable from block states alone.
- **The brief's user "may not view career as central passion"** yet the aspiration system wants "professional growth." The product should not assume work blocks are the most important blocks; the goal model must treat family, health, and rest goals as fully equal.
- **Screen-escape tracking** is simultaneously listed as a capability (§7.8) and questioned as potentially harmful (§13.4). This must ship as an experiment, not a commitment.

## 9. Likely Failure Modes (Product-Level)

1. User plans enthusiastically for two weeks, execution features go unused, app becomes a planning toy, then is abandoned — *the loop, reproduced in software.*
2. A single bad week produces a review screen that reads as an indictment; user never opens the app again.
3. Logging honesty decays: user marks things complete or stops logging misses; insights become fiction; user senses the fiction and disengages.
4. Feature accretion: energy tracking, pattern detection, and adaptive suggestions built before the core start-and-recover loop is proven; complexity itself becomes overload.
5. Notifications, if any, become nagging — experienced as external demands, triggering the same anger as requests from others.

## 10. Assumptions I Am Making (Not From the Brief)

- Single user, male pronouns per the brief; no multi-tenancy, sharing, or social features ever needed.
- The `_en` suffix suggests a translated original; I assume the **UI language should be English** unless you say otherwise — worth confirming, since non-judgmental phrasing is language-sensitive and hard to translate well.
- Primary devices: phone (execution moments, daily review) and laptop/desktop (weekly planning). Modern evergreen browsers only.
- One timezone at a time; weeks start on a fixed day (I'll assume Sunday or Monday — please confirm which, since the weekly cycle is the product's spine).
- Calendar integration means **export to** an external calendar (the user's real calendar remains the source of truth for fixed obligations), not two-way sync, at least initially.
- No clinical claims, no diagnosis, no mood tracking framed as mental-health measurement — consistent with §12.

---

*Awaiting approval of this interpretation (Gate 1) before proceeding to Phase 2: Product Scope and System Proposal.*
