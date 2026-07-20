# Bttrme

Personal single-user web app bridging intention and action. Not a productivity app — see `phase_1_need_interpretation.md` before touching product behavior. All planning documents (need brief, phases 1–5, PRDs 01–06, final implementation plan) live in this repo root and are the source of truth.

## Stack

Next.js (App Router) · TypeScript strict · Tailwind (logical properties only — RTL-first) · Drizzle + Neon Postgres · Vercel Hobby · Vitest · Playwright. **$0/month is a standing NFR.**

## Setup (local)

1. Node ≥ 22 (this machine: installed at `~/.local/node`; add to PATH: `export PATH="$HOME/.local/node/bin:$PATH"`) and pnpm ≥ 11.
2. `pnpm install`
3. Copy `.env.example` → `.env.local`; fill `DATABASE_URL` (Neon **dev** branch, pooled), `SESSION_SECRET`, `CRON_SECRET`.
4. `pnpm dev` → http://localhost:3000

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` / `pnpm build` | Develop / production build |
| `pnpm typecheck` · `pnpm lint` · `pnpm test` | CI trio (also runs on every push) |
| `pnpm test:e2e` | Playwright (login flows, RTL smoke) |
| `pnpm db:generate` | Generate SQL migration from `src/db/schema.ts` into `drizzle/` (append-only, committed) |
| `pnpm db:migrate` | Apply migrations to `DATABASE_URL` — **run manually against prod before merging dependent code** |
| `pnpm seed` | Create the single user (once per environment) |
| `pnpm set-password` | Password reset path (no reset UI by design) |

## Guard tests (the product's promises, in CI)

- **Catalog parity** — `i18n/en.ts` and `i18n/he.ts` have identical key sets.
- **Vocabulary guard** — no judgment words in either catalog (`src/i18n/forbidden.ts`; Hebrew list owned by Michael).
- **No hardcoded JSX strings** in `src/app` + `src/ui` (ESLint `react/jsx-no-literals`).
- **`events` is append-only** — no update/delete call sites, ever.

## Deploy

`main` auto-deploys to Vercel. Routine deploys: migrate prod if needed → merge to `main` → on-device smoke. Restore procedure: `RESTORE.md` (written at the M1 Neon PITR test).
