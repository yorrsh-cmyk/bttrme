// The documented password-reset path (PRD 01 FR-3): no reset UI exists.
// Usage: pnpm set-password

import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { eq } from "drizzle-orm";
import { hashPassword } from "../src/server/password";
import { askHidden } from "./lib/prompt";

async function main() {
  const { db } = await import("../src/db/client");
  const { user, session } = await import("../src/db/schema");

  const rows = await db.select().from(user).limit(1);
  const me = rows[0];
  if (!me) {
    console.error("No user exists yet — run pnpm seed first.");
    process.exit(1);
  }

  const password = await askHidden(`New password for "${me.username}" (min 12 chars): `);
  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(1);
  }
  const confirm = await askHidden("Repeat password: ");
  if (password !== confirm) {
    console.error("Passwords do not match.");
    process.exit(1);
  }

  await db.update(user).set({ passwordHash: await hashPassword(password) }).where(eq(user.id, me.id));
  // Existing sessions die with the old password.
  await db.delete(session).where(eq(session.userId, me.id));

  console.log("Password updated; all sessions signed out.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
