# Prompt for the next session — start Milestone 1

Copy-paste this into a fresh Claude Code session in this folder:

---

Read `CLAUDE.md`, `final_implementation_plan.md`, and `PRD_01_Foundation_and_Authentication.md`, then begin implementing **Milestone 1 (Foundation and Authentication)**.

All 7 planning gates are approved, including the final implementation plan. Seed values are confirmed: timezone Asia/Jerusalem, week starts Sunday, initial language Hebrew, app name Bttrme.

Work in this order:

1. Bootstrap the repo skeleton in this folder per the structure in `final_implementation_plan.md` §1 (Next.js App Router + TypeScript strict + Tailwind + Drizzle + Vitest + Playwright), with CI config for GitHub Actions.
2. Build the i18n foundation first (typed catalogs `en.ts`/`he.ts`, dir switching, catalog-parity test) and the vocabulary guard test with a starter forbidden-word list — then pause to run the **Hebrew vocabulary session** with me: the six core state words and the Hebrew forbidden list.
3. Migration 001 (user, session, login_attempt, events), auth (argon2id, hashed session tokens, rate limiting), seed script, login screen with language toggle, and the RTL-correct app shell with placeholder pages.
4. Tell me exactly when you need me to create the GitHub, Vercel, and Neon accounts (all free tiers) and what to paste back to you; then wire up deploy, run the seed, and walk through the M1 release checklist (`final_implementation_plan.md` §9), including the Neon restore test and the phone cold-start measurement.

M1 is done when I've signed in from my phone and laptop in Hebrew and approved the shell (PRD 01 §15). Don't start M2 without my approval.

---

## Notes for me (Michael), before that session

- Have ready: a GitHub account, and be prepared to create free Vercel + Neon accounts when asked (email + OAuth via GitHub is easiest).
- Decide my username and a strong password for the seed step.
- Budget ~10 minutes for the Hebrew vocabulary session — it defines the app's voice and becomes a CI test.
