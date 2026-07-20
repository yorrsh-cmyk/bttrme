# Phase 2: Product Scope and System Proposal

Status: Draft for approval — Gate 2 of 7
Depends on: `phase_1_need_interpretation.md` (approved)

---

## Part A: Product Scope in Three Layers

The layering principle follows directly from Phase 1: **prove the start-and-recover loop before building the measurement apparatus.** Risks #4 (logging burden), #6 (overbuilding), and failure mode #4 (feature accretion before the core loop is proven) all argue for an MVP that is smaller than the brief's full capability list — and for treating everything measurement-related as Layer 2 experiments, not Layer 1 commitments.

### Layer 1: Minimum Viable Product — "The Start Loop"

**Problem it solves:** the execution moment carries negotiation and identity stakes; misses have no recovery path; weeks don't carry learning forward. This layer attacks exactly those three points and nothing else.

**Capabilities:**

1. **Sign-in** — username + password, single account, sessions persist across devices.
2. **Block library** — reusable block templates the user defines once: name, category (work / family / personal / health / rest), default duration, expected outcome, first action. This is what makes planning fast: composing a week from known blocks instead of authoring from scratch.
3. **Weekly planning** — pick up to 3 weekly goals (typed fresh or carried from last week's review); build the week's pool by pulling blocks from the library (or creating one-off blocks); goals stay visible while building.
4. **Daily scheduling** — place blocks from the pool onto days, into **parts of day (morning / afternoon / evening) with optional exact times**. Per Phase 1 hypothesis: exact times are opt-in, not required.
5. **Execution view** — the mobile-first "now" screen: the current/next block with its full pre-decided context (what, expected outcome, duration, why this day, first action) and exactly four responses: **Start**, **Defer to later today**, **Move to another day**, **Skip** (recorded as "not completed," no penalty). After Start: a **Done** / **Stopped early** close-out.
6. **Recovery flow** — when a block's window passed without a response, the next time the user opens the app they get one screen: "This block's time passed" with the same bounded options. No red, no "overdue," no accumulation; at day's end unresolved blocks resolve to "not completed" automatically.
7. **Daily review** — auto-derived from block states (completed / not completed / deferred / moved), presented as a read-only summary the user confirms in one tap. Optional single free-text line. Under a minute, skippable without trace.
8. **Weekly review** — the week's block outcomes by category and goal; three prompts (what worked, what was heavy, what to change *in planning*); then set the next week's 3 goals with last week's shown alongside. Output feeds capability 3.
9. **Responsive web UI** — phone-first for execution/review, desktop-comfortable for weekly planning. Same app.

**Deliberately excludes:** calendar export, insights/analytics dashboards, energy and resistance tracking, screen-escape logging, notifications of any kind, pattern suggestions, data export, offline support. Each exclusion is justified in Part C.

**Must be validated before Layer 2** (through lived use, ~3–4 real weeks):

- Does the execution view actually get opened at execution moments, or does the app get used only for planning? (Failure mode #1 — this is the kill-or-pivot question.)
- Parts-of-day vs. exact times: which does the user actually use?
- Is the weekly volume the user plans sustainable, and does the system need a firmer cap?
- Are daily reviews completed, and do they stay under a minute?
- Does the recovery flow get used after misses, or does a bad day still end the week?

### Layer 2: First Complete Personal Version — "The Mirror"

**Problem it solves:** with the start loop proven, add the *witness* — the accurate, non-judgmental record that contradicts the inner critic — plus the integrations that make the system livable long-term (real calendar, rest as first-class, data safety).

**Capabilities:**

1. **Rest and screen-free blocks as first-class citizens** — plannable, protected, and counted as commitments kept (not as gaps between work). Includes the "restorative vs. not restorative" one-tap observation after rest blocks — the minimal version of energy tracking.
2. **Energy/resistance observations, optional** — at block close-out, an optional one-tap "how heavy was starting?" (light / medium / heavy) and "energy after?" (better / same / worse). Strictly skippable; skipping is untracked.
3. **Insights view, forward-framed** — surfaces patterns *as planning input*: "evening blocks were deferred 3 of the last 4 weeks — plan lighter evenings?"; "blocks under 30 minutes get started far more often." Shown at weekly-planning time, not as a standing report card. No percentages-as-grades on the home screen, ever.
4. **Avoidance logging as an experiment** — a single button ("escape happened") available from the execution view, recording the event with zero follow-up questions. Explicitly framed in-product as an experiment; if unused or guilt-generating after a few weeks, removed. (Brief assumption #4.)
5. **Calendar export** — a private, token-secured **ICS feed URL** the user subscribes to from Google/Apple Calendar. Scheduled blocks appear in his real calendar; the real calendar remains the source of truth for external obligations. Read-only, one-way.
6. **Data export and backup** — one-click full JSON export from the UI; automated database backups (see Part B). His data, always retrievable.
7. **Re-entry polish** — after any absence (a day, a week), the app opens to *today* with a single neutral line ("Welcome back — here's today") and an optional one-tap "archive the missed days" that closes old blocks as "not completed" in bulk. No backfilling asked, ever.

**Deliberately excludes:** pattern *suggestions* generated automatically (Layer 3 — first the data must prove honest), two-way calendar sync, notifications, any scoring.

**Must be validated before Layer 3:**

- Is the logged data honest enough to learn from? (Compare weekly-review free text against block states.)
- Do the insights change planning behavior, or are they ignored?
- Did avoidance logging survive its experiment?
- Is the ICS feed used, or is calendar overlap not actually a need?

### Layer 3: Later Extensions — "The Learning System"

Only if Layers 1–2 are alive and honest after months of use:

1. **Adaptive planning suggestions** — the system proposes next week's draft from history (which blocks, which days, what volume), user edits rather than authors. The strongest attack on cognitive overload, but only safe once data is proven honest and the framing proven non-judgmental.
2. **Gentle time-of-block notifications** — opt-in, per-block, phrased as context ("Deep work — first action: open the draft") not demands. High risk of becoming external coercion (Phase 1 failure mode #5); deferred until the user asks for it.
3. **Two-way calendar sync** — external calendar events imported as fixed commitments the week is planned around. Meaningful complexity (OAuth, sync conflicts); only if one-way proves insufficient.
4. **PWA install + offline** — home-screen icon, works in dead zones. Nice-to-have; a responsive web app covers most of it.
5. **LLM-assisted weekly review** — a reflective summary drafted from the week's data in the product's non-judgmental vocabulary. Interesting, strictly optional, never before the human loop works.

---

## Part B: Technical Approach

### Guiding constraint

One user, one login, modest data volume (thousands of rows per year, not millions), phone + desktop browsers, and a strong premium on **low maintenance and not losing data**. The stack should be boring, coherent, cheap-to-free, and easy to extend with the Layer 2/3 features later.

### Recommendation at a glance

| Concern | Recommendation |
|---|---|
| Framework | **Next.js (App Router) + TypeScript** — one codebase for UI and API |
| Languages | **Hebrew + English**, user-selectable at login and in settings; RTL-first layout (approved addition at Gate 6) |
| UI | **Tailwind CSS**, mobile-first responsive; no component-library lock-in |
| Database | **PostgreSQL, managed (Neon free tier)** |
| ORM / migrations | **Drizzle ORM + drizzle-kit migrations** |
| Auth | Single-user credentials: **argon2** password hash, httpOnly session cookie (iron-session); no auth SaaS |
| Hosting | **Vercel free tier** (Next.js's native home) |
| Calendar | Layer 2: token-secured **ICS feed** endpoint |
| Analytics | Internal `events` table only; **no third-party analytics** |
| Backups | Neon point-in-time restore + nightly JSON snapshot + in-UI export |
| Testing | **Vitest** for domain logic, **Playwright** for the few critical flows |

### Reasoning and tradeoffs

**Full-stack Next.js rather than separate frontend + backend.** The product is UI-heavy (drag/tap scheduling, an execution view, reviews) with a thin API. A single TypeScript codebase means one deploy, one language, shared types between the data model and the UI, and the least surface to maintain. Server Actions / route handlers cover everything the backend needs. A separate API service would be pure overhead here.

*Alternatives considered:* **SvelteKit** — genuinely nice and lighter-weight; Next.js wins on ecosystem maturity and long-term maintainability, and nothing here needs Svelte's strengths. **Rails or Django** — excellent batteries-included options, but the interaction-heavy mobile UI would end up needing a JS layer anyway, and a second language raises the maintenance surface for a solo project.

**Managed Postgres (Neon) rather than SQLite.** SQLite would honestly suffice for one user, and a VPS + SQLite + Litestream setup maximizes data ownership. But it puts *you* on the hook for a server, its upgrades, and its backup pipeline. Neon's free tier gives a real Postgres with point-in-time restore and zero servers to tend; Vercel + Neon means the entire system has no machine you administer. Given "not losing data" and "low maintenance" are the top constraints, managed wins. Postgres also removes any migration pain if Layer 3 ever wants heavier queries.

*The tradeoff:* your data lives with two third-party services (both with straightforward exit paths — the app is a standard Next.js container away from any VPS, and Postgres dumps are portable). The in-UI JSON export and nightly snapshots are the hedge. If you'd rather own the metal from day one, the VPS/SQLite variant is a fine second choice — say so and I'll plan for it instead.

**Hand-rolled single-user auth rather than an auth provider.** Auth.js, Clerk, etc. solve problems this product doesn't have (signup, OAuth, multi-tenancy). For one fixed user: a `user` row with an argon2 hash, a login form, an httpOnly encrypted session cookie, and rate-limited login attempts. ~100 lines, standard practice, nothing exotic — and no third-party dependency in the most security-sensitive spot. Password resets happen by you resetting it via a script/DB — acceptable for a personal tool.

**ICS feed rather than Google Calendar API.** A read-only ICS subscription URL (with a long random token, revocable) gets blocks into Google/Apple Calendar with zero OAuth, zero API quotas, zero sync state. The known limitation — calendar apps refresh feeds on their own schedule (minutes to hours) — is acceptable for planning visibility. Two-way sync stays a Layer 3 decision.

**Internal events table rather than analytics SaaS.** The success metrics in the brief (§11) are computable from the app's own data: block state transitions, review completions, recovery-after-miss counts. A simple append-only `events` table captures state changes with timestamps; the Layer 2 insights view reads from it. Third-party analytics would add a privacy cost and no capability. This table is also the "history preserved as data" principle made concrete.

**Backup and portability, three layers:** (1) Neon's built-in point-in-time restore for disasters; (2) a nightly job (Vercel cron) writing a full JSON snapshot to blob storage; (3) the in-UI "Export my data" button producing the same JSON on demand. Restore paths tested as part of Layer 2's definition of done.

**Development and testing approach.** Domain logic (block lifecycle transitions, week rollover, carry-forward of goals, review derivation) lives in plain TypeScript modules, unit-tested with Vitest — this is where correctness matters and where the non-judgmental state machine ("skip is not fail") is encoded. Playwright covers a handful of end-to-end flows: login, plan a week, schedule a day, complete/defer a block, weekly review carry-forward. No aspiration to high coverage numbers; tests protect the loop, not the pixels. Development happens against a local Postgres (Docker) or a Neon branch; schema changes only via drizzle-kit migrations from day one, so production migrations are routine rather than scary.

**Costs and accounts.** Vercel (free Hobby tier) and Neon (free tier) both comfortably fit a one-user app; expected running cost **$0/month**, with a custom domain optional (~$10/year — the free `*.vercel.app` domain works fine if you'd rather skip it). You'll need to create both accounts during Milestone 1.

> **Binding constraint (approved at Gate 2): free services only.** No component of this plan may require a paid subscription. If a free tier is ever discontinued or outgrown, the exit path is: export Postgres dump → any other free Postgres host (e.g., Supabase free tier) or local SQLite; the app itself deploys anywhere Node.js runs.

---

## Part C: Justification of Notable Exclusions

Per the working-style rule — every rejection explained:

- **Notifications (excluded until Layer 3):** the user experiences external demands as coercion and reacts with anger (brief §6, "sense of coercion"). A notification is a demand from a machine. Until the pull-based loop is proven, push is more likely to trigger the resistance than to bypass it.
- **Screen-escape tracking (Layer 2, as a removable experiment):** flagged by the brief itself as possibly guilt-generating (assumption #4). It doesn't gate anything in the core loop, so it earns its place by trial, not by default.
- **Scores, streaks, completion percentages on the home screen (excluded permanently):** direct violation of "measure behavior, present learning." Streaks in particular convert one miss into a visible broken chain — the exact verdict mechanism the product exists to dismantle.
- **Energy tracking in the MVP (moved to Layer 2):** every added logging touchpoint at low-energy moments raises the risk the user stops logging at all. The MVP's data ask is the absolute minimum: block outcomes.
- **Offline/PWA (Layer 3):** real cost (sync conflicts) for marginal benefit in a life lived mostly in connectivity. A fast responsive site covers the need.
- **Task capture / inbox / someday lists (excluded permanently):** an unbounded capture list is the "endless task list" the brief forbids (§12). The library of *reusable block types* is the deliberate replacement: bounded, curated, planning-time-only.

---

*Awaiting approval of scope and stack (Gate 2). On approval I'll produce the Phase 3 milestone plan and per-milestone PRDs.*
