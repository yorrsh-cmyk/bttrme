# RESTORE.md — Bttrme recovery procedures

Three independent backup layers (plan §8, PRD 06). Only **Neon PITR** exists at
M1; the JSON-snapshot and in-UI-export layers arrive in M6, and this file grows
with them. Every procedure here is meant to be *drilled*, not trusted on faith.

## Layer 1 — Neon point-in-time recovery (disaster / bad migration)

Neon retains history on the free tier (a rolling window — confirm the exact
retention in the project's **Settings → Storage**). Any moment inside that
window can be recovered as a new branch, verified, then promoted.

### Procedure (Neon console)

1. **Neon → project `bttrme` → Branches → New branch.**
2. Branch from **`main`**, choosing **"Include data up to a point in time"** and
   set the timestamp to **one minute before** the incident (a bad migration, a
   bad write). Name it e.g. `restore-YYYYMMDD`.
3. Neon gives the restore branch its own pooled connection string. Point a local
   checkout at it (`DATABASE_URL=… pnpm dev`) or query it directly, and verify
   the data is intact and the damage is absent.
4. Promote the good branch to primary: either **reset `main` from the restore
   branch** (Branches → `main` → Reset from…) or repoint the app's
   `DATABASE_URL` (Vercel env var) to the restore branch and redeploy.
5. Update the `DATABASE_URL` in Vercel if the endpoint changed; redeploy.

The data-loss window is bounded by the incident's own duration — acceptable for
a single user, stated honestly (plan §8).

### App rollback (independent of the database)

Migrations are applied ahead of code and are additive-by-default, so the
previous app version always runs against the current schema. In Vercel →
Deployments, **"Promote to Production"** on the last good deployment is instant.

## M1 test-restore drill — record of the exercise

> Performed once during M1 to prove the path works (PRD 01 acceptance +
> plan §9). Fill in when the drill is done.

- Date performed: _____________________
- Retention window observed in Neon Settings → Storage: _____________________
- Restore branch name: _____________________
- Recovery point chosen: _____________________
- Verification query used and result (e.g. `SELECT count(*) FROM "user";` → 1):
  _____________________
- Restore branch deleted after the drill: ☐
- Notes / surprises: _____________________

## Password reset (not a data-loss path, but the only account recovery)

No reset UI by design (PRD 01 FR-3). From a checkout with the target
`DATABASE_URL` set:

```sh
export PATH="$HOME/.local/node/bin:$PATH"
DATABASE_URL='…the target branch pooled URL…' pnpm set-password
```

This re-hashes the password (argon2id) and signs out all existing sessions.
