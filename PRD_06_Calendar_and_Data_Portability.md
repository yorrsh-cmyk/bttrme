# PRD 06: Calendar Export and Data Portability

Milestone: M6 · Layer: 2 · Status: Draft for Gate 4 approval
May run in parallel with M5 after the validation period (no dependency between them).

## 1. Milestone Objective

Connect scheduled blocks to the user's real calendar via a private ICS feed, and make his data permanently safe and portable: in-UI full export, automated nightly snapshots, and a tested restore path — all within free tiers.

## 2. User Problem Addressed

Integration: the user's fixed obligations live in a real calendar (work, family); planned blocks invisible there are planned blocks that collide with reality (brief §7.3–7.4: build a realistic week around fixed commitments; protect work/personal/family/rest time). Trust: a system asked to hold months of behavioral history must provably never lose it or trap it (brief §13.14 touches what should be stored; portability is the user's guarantee that storage serves him).

## 3. Scope

- Read-only ICS feed of scheduled blocks, token-secured, revocable, subscribable from Google and Apple Calendar.
- Feed content controls (what detail the calendar shows).
- In-UI "Export my data" → complete JSON.
- Nightly snapshot job (Vercel cron, free tier) → same JSON to storage; documented, tested restore.
- Settings section: calendar feed management + export/backup status.

Explicitly not: two-way sync, OAuth calendar APIs, importing external events into the app (Layer 3 decisions).

## 4. User Stories

- As the user, I want my scheduled blocks to appear in the calendar I already live in, so my plan and my obligations exist in one view and stop colliding.
- As the user, I want to regenerate the feed URL in one click if it ever leaks, so a private-by-obscurity URL has an escape hatch.
- As the user, I want one button that hands me every byte of my data in a readable format, so I never depend on this app's survival.
- As the user, I want backups to happen without my involvement and to know they're happening, so trusting the app with my history is rational.

## 5. Functional Requirements

**ICS feed**
- FR-1: `GET /calendar/{token}.ics` serves an RFC 5545 feed; token is ≥ 128 bits random, stored hashed, shown once at creation, regenerable from settings (old token immediately invalid).
- FR-2: Feed contains scheduled blocks from (today − 7 days) to (today + 21 days). Exact-time blocks → timed events of their duration. Part-of-day blocks → timed placeholders in configurable windows (defaults: morning 08–12, afternoon 12–17, evening 17–22, rendered at the window start, duration = block duration; windows editable in settings).
- FR-3: Feed detail is configurable: **minimal** (block name only — default) or **standard** (name + expected outcome). First action and notes never leave the app (a leaked feed URL should expose a skeleton, not an inner life). Completion state is never exported — the calendar shows the plan, not the record.
- FR-4: Rescheduling/moving a block updates the event (stable UID per block); `not_completed` blocks simply age out of the window — no "declined"/strikethrough theater in the calendar.
- FR-5: Settings shows subscription instructions for Google Calendar and Apple Calendar, and states the refresh-latency caveat plainly (Google may lag hours).

**Export**
- FR-6: "Export my data" streams a single JSON document: user settings, templates, weeks, goals, blocks, reviews, and the full `events` table — every field, documented by a `schema_version` and a top-level explanation of entities. Target: usable by a future program or a patient human, not just re-import.
- FR-7: Export completes in-request for expected data volumes (years ≈ tens of MB at most); no background job needed.

**Backups**
- FR-8: A Vercel cron (free tier: daily) invokes a route that writes the FR-6 JSON, compressed, to storage; retain 30 dailies + 12 monthlies, pruned by the same job.
- FR-9: Storage choice must be free-tier durable: Vercel Blob free tier if its limits hold the retention set comfortably, else Cloudflare R2 free tier. Decided at implementation with a written note; both have zero-cost paths at this volume.
- FR-10: Settings shows last-snapshot timestamp and a neutral warning state if the newest snapshot is > 48h old — the one place the app is allowed to nag, because it's nagging about itself.
- FR-11: `RESTORE.md` in the repo documents restore end-to-end (fresh Neon DB ← snapshot), and the procedure is executed once for real against a scratch database as part of this milestone.

## 6. Non-Functional Requirements

- Feed responds < 1s (calendar clients time out unceremoniously); valid per RFC 5545 (validated with a linter and by both target clients).
- Feed route is the only unauthenticated route besides `/login`; it rate-limits per-IP and serves nothing on token mismatch (404, not 401 — no oracle).
- Export/backup code paths share one serializer (no drift between what the button and the cron produce).
- Everything free-tier: Vercel cron daily schedule, Blob/R2 free limits verified against retention math before choosing.

## 7. Data Model Changes

- `calendar_feed` — id, token_hash, detail_level (`minimal|standard`), created_at, revoked_at. (One active row; history kept.)
- `user` extended: part-of-day window times (morning/afternoon/evening start–end).
- `snapshot_log` — id, at, location, size_bytes, status. New events: `feed_created`, `feed_revoked`, `export_downloaded`, `snapshot_written`, `snapshot_failed`.

## 8. Main User Flows

1. **Set up calendar:** Settings → Calendar → create feed → copy URL → follow in-app instructions for Google/Apple → blocks appear among real events.
2. **Leak response:** Settings → regenerate → old URL dead, new URL to re-subscribe. Two taps plus re-subscribing.
3. **Export:** Settings → Export my data → JSON downloads.
4. **Disaster drill (once, in-milestone):** restore snapshot to scratch DB per `RESTORE.md` → app boots against it → spot-check a week's data.

## 9. Edge Cases

- Calendar client fetches a revoked token → 404 body; client shows the subscription as broken — correct and desired.
- Part-of-day windows overlapping or reordered by the user's edits → settings validates windows are non-overlapping and ordered; blocks render per current settings (historical feed accuracy is a non-goal — the feed is forward-looking).
- Timezone: ICS events carry the user's IANA timezone (VTIMEZONE); a travel week renders correctly on the phone's local view.
- Snapshot job failure (storage hiccup) → `snapshot_failed` event, settings warning per FR-10; next night retries by design (idempotent job).
- Export while a review is mid-edit → export is a consistent single-transaction read; whatever is committed, ships.
- 0 scheduled blocks in the window → valid empty calendar, not an error.

## 10. Acceptance Criteria

- [ ] Feed subscribed and rendering correctly in both Google Calendar and Apple Calendar on the user's real devices; exact-time and part-of-day blocks both verified.
- [ ] Regeneration kills the old URL (verified) and the new one works.
- [ ] Detail levels verified: minimal shows names only; first action/notes absent from the wire in both levels (checked on raw feed text).
- [ ] Export JSON opened and spot-checked by the user; schema_version and entity docs present.
- [ ] 3+ consecutive nightly snapshots in storage with pruning verified by inspection; settings shows last-snapshot time.
- [ ] Restore drill executed against a scratch database; `RESTORE.md` corrected to match reality.
- [ ] Feed p95 latency < 1s; ICS passes validation.

## 11. Analytics / Observability Requirements

Events as §7. `snapshot_failed` is the one event that must be *noticed* — hence the FR-10 settings surface. No external monitoring service (free-tier constraint and proportionality); the user glancing at settings weekly is the monitoring plan, stated honestly.

## 12. Out of Scope

Two-way sync and calendar-event import (Layer 3); per-category feed filtering (add later if the single feed annoys); PDF/CSV export formats (JSON is the portability guarantee; others on demand); automated restore tooling (a documented manual procedure is proportional).

## 13. Dependencies

M3 (scheduled blocks). Independent of M4/M5 features but sequenced after the validation period per the milestone plan.

## 14. Risks and Open Questions

- **Risk:** Google's ICS refresh lag (hours) reads as "the app is broken." Mitigation: stated in-product at setup (FR-5); Apple/phone clients refresh faster and the phone is the primary surface.
- **Risk:** feed URL leakage. Mitigations: hashed token, minimal default detail, instant regeneration, no completion data ever in the feed.
- **Risk:** free-tier storage limit changes strand the snapshot job. Mitigation: two candidate providers (FR-9), shared serializer makes retargeting trivial, FR-10 makes silence visible.
- ~~Open question~~ **Decided (Gate 4):** rest blocks **are exported** to the calendar (name-only at the default detail level).

## 15. Definition of Done

All acceptance criteria checked on the user's real calendar clients; restore drill done; serializer and feed generation unit-tested (including timezone/VTIMEZONE cases); deployed; M6 approval given — which closes Layer 2. Any Layer 3 work begins with a fresh proposal, not an assumption.
