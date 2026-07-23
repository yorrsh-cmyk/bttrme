import { config } from "dotenv";
config({ path: ".env.local" });

// The login rate-limiter is global by design (single-user app), so the
// deliberate wrong-password test would otherwise accumulate lockouts across
// repeated suite runs. Clearing login_attempt before the run keeps e2e
// deterministic. Also clears this suite's throwaway planning fixtures.
export default async function globalSetup() {
  if (!process.env.E2E_USERNAME || !process.env.DATABASE_URL) return;

  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL);

  await sql.query("DELETE FROM login_attempt");
  // Remove leftover 'בדיקה …' templates/blocks from earlier planning runs.
  await sql.query(
    "DELETE FROM block WHERE template_id IN (SELECT id FROM block_template WHERE name LIKE 'בדיקה %')",
  );
  await sql.query("DELETE FROM block_template WHERE name LIKE 'בדיקה %'");
}
