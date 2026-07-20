// One-time per environment: creates the single user (plan §4).
// Usage: pnpm seed   (DATABASE_URL from .env.local decides the target)
// Defaults per Gate 7: timezone Asia/Jerusalem, week starts Sunday, Hebrew.

import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { hashPassword } from "../src/server/password";
import { ask, askHidden } from "./lib/prompt";

async function main() {
  const { db } = await import("../src/db/client");
  const { user } = await import("../src/db/schema");

  const existing = await db.select({ id: user.id }).from(user).limit(1);
  if (existing.length > 0) {
    console.error("A user already exists — seed is one-time. Use pnpm set-password to reset.");
    process.exit(1);
  }

  // Non-interactive path (automation/CI): SEED_USERNAME + SEED_PASSWORD.
  let username = process.env.SEED_USERNAME;
  let password = process.env.SEED_PASSWORD;

  if (!username || !password) {
    username = (await ask("Username [michael]: ")) || "michael";
    password = await askHidden("Password (min 12 chars): ");
    const confirm = await askHidden("Repeat password: ");
    if (password !== confirm) {
      console.error("Passwords do not match.");
      process.exit(1);
    }
  }

  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(1);
  }

  await db.insert(user).values({
    username,
    passwordHash: await hashPassword(password),
    timezone: "Asia/Jerusalem",
    weekStartDay: "sun",
    language: "he",
  });

  console.log(`Seeded user "${username}" (Asia/Jerusalem, Sunday weeks, Hebrew).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
