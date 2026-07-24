import { config } from "dotenv";
import { expect, test } from "@playwright/test";

// Load .env.local into the worker process (the absence test talks to the DB).
config({ path: ".env.local" });

// M3 execution flows (plan §6): plan-day → start → done, the one-tap Skip + undo,
// and recovery after a simulated absence. Runs in Hebrew, the primary language.
// Determinism note: the "current" block depends on the wall clock, so these
// tests place blocks into the EVENING — always the current-or-later part — so the
// block is reliably foregrounded regardless of when CI runs. The clock-dependent
// passed-window split is covered by the blockMachine unit tests.

const username = process.env.E2E_USERNAME;
const password = process.env.E2E_PASSWORD;

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login?lang=he");
  await page.getByLabel("שם משתמש").fill(username!);
  await page.getByLabel("סיסמה").fill(password!);
  await page.getByRole("button", { name: "כניסה" }).click();
  await expect(page.getByRole("heading", { name: "מה חשוב השבוע" })).toBeVisible();
}

// Tab links appear both in the nav bar and (some) inside page bodies, so scope
// navigation clicks to the nav to avoid strict-mode collisions.
function navLink(page: import("@playwright/test").Page, name: string) {
  return page.getByRole("navigation").getByRole("link", { name, exact: true });
}

// Create a library template, add it to the week pool, and place it on today's
// evening. Returns the unique block name so the caller can find its card.
async function planEveningBlock(page: import("@playwright/test").Page): Promise<string> {
  const name = `בדיקה ${Date.now()}`;

  await navLink(page, "הספרייה").click();
  await page.getByRole("button", { name: "סוג פעולה חדש" }).click();
  await page.getByLabel("שם", { exact: true }).fill(name);
  await page.getByLabel("מטרה", { exact: true }).fill("מטרת הבדיקה");
  await page.getByLabel("צעד ראשון").fill("הצעד הראשון");
  await page.getByRole("button", { name: "שמירה" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: name })).toBeVisible();

  // Add to this week's pool.
  await navLink(page, "השבוע").click();
  await page.getByRole("button", { name: "הוספה מהספרייה" }).click();
  await page.getByRole("button", { name: new RegExp(name) }).click();

  // Place onto today's evening from the day view.
  await navLink(page, "היום").click();
  await page.getByRole("link", { name: "לתכנן את היום" }).first().click();
  const poolCard = page.getByRole("listitem").filter({ hasText: name });
  await poolCard.getByRole("button", { name: "ערב" }).click();
  // It now lives under the day's Evening group.
  await expect(page.getByRole("heading", { name: "ערב" })).toBeVisible();

  return name;
}

test.describe("execution", () => {
  test.skip(!username || !password, "needs a seeded database (E2E_USERNAME/E2E_PASSWORD)");

  test("plan a day, start a block, and complete it", async ({ page }) => {
    await login(page);
    const name = await planEveningBlock(page);

    // On Today the evening block is foregrounded with its first step + Start.
    await navLink(page, "היום").click();
    await expect(page.getByRole("heading", { name })).toBeVisible();
    await expect(page.getByText("הצעד הראשון").first()).toBeVisible();

    // Start → the active close-out (Done / Stopped early), neutral elapsed.
    await page.getByRole("button", { name: "התחל" }).click();
    await expect(page.getByRole("button", { name: "סיימתי" })).toBeVisible();
    await expect(page.getByText("מתוכנן")).toBeVisible();

    // Done → the calm empty state, no counts, no judgment.
    await page.getByRole("button", { name: "סיימתי" }).click();
    await expect(page.getByText("אין עוד תכנונים")).toBeVisible();
  });

  test("skip is one tap and undoable", async ({ page }) => {
    await login(page);
    const name = await planEveningBlock(page);

    await navLink(page, "היום").click();
    await expect(page.getByRole("heading", { name })).toBeVisible();

    // One-tap Skip — no confirm dialog. The undo bar appears.
    await page.getByRole("button", { name: "דלג", exact: true }).click();
    const undo = page.getByRole("button", { name: "ביטול פעולה" });
    await expect(undo).toBeVisible();

    // Undo brings the block back to the foreground (Start visible again).
    await undo.click();
    await expect(page.getByRole("button", { name: "התחל" })).toBeVisible();
  });

  test("a block out of line can be picked and started directly", async ({ page }) => {
    await login(page);
    const first = await planEveningBlock(page);
    const second = await planEveningBlock(page);

    await navLink(page, "היום").click();
    // The first-placed block is foregrounded; the second is a quiet upcoming card.
    await expect(page.getByRole("heading", { name: first })).toBeVisible();

    // Tap the upcoming card to open it, then start it out of order.
    const upcoming = page.getByRole("article").filter({ hasText: second });
    await upcoming.getByRole("button", { name: second }).click();
    await upcoming.getByRole("button", { name: "התחל" }).click();

    // It becomes the active block: the close-out (Done) is now shown.
    await expect(page.getByRole("button", { name: "סיימתי" })).toBeVisible();
  });

  test("returning after a simulated absence lands on a clean today", async ({ page }) => {
    await login(page);
    // Materialise the current week so we have a valid week id to hang blocks on.
    await navLink(page, "השבוע").click();

    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL!);
    const ymd = (offsetDays: number) =>
      new Date(Date.now() - offsetDays * 86_400_000).toISOString().slice(0, 10);
    const [d1, d2] = [ymd(1), ymd(2)];
    const marker = `בדיקה-absence-${Date.now()}`;

    try {
      const wk = await sql`SELECT id FROM week ORDER BY start_date DESC LIMIT 1`;
      const weekId = wk[0]!.id as string;
      for (const d of [d1, d2]) {
        await sql`INSERT INTO block (week_id, name, category, duration_min, expected_outcome, first_action, status, scheduled_date, part_of_day, day_order)
          VALUES (${weekId}, ${marker}, 'work', 30, 'o', 'f', 'scheduled', ${d}, 'morning', 0)`;
      }

      // Two absent days → the calm "start fresh" screen (no count, no red).
      await navLink(page, "היום").click();
      await expect(page.getByRole("button", { name: "החל מחדש" })).toBeVisible();
      await page.getByRole("button", { name: "החל מחדש" }).click();

      // Lands on a clean today; the absence screen is gone.
      await expect(page.getByRole("button", { name: "החל מחדש" })).toHaveCount(0);
    } finally {
      await sql`DELETE FROM block WHERE name = ${marker}`;
    }
  });
});
