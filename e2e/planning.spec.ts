import { expect, test } from "@playwright/test";

// M2 planning flow (plan §6). Needs a seeded database (E2E_USERNAME/E2E_PASSWORD);
// runs in Hebrew, the primary language. Uses a uniquely-named template so it is
// robust against whatever else already lives in the dev database. Navigation is
// via the app's own tab links (not page.goto), so it can't race the post-login
// redirect.

const username = process.env.E2E_USERNAME;
const password = process.env.E2E_PASSWORD;

test.describe("weekly planning", () => {
  test.skip(!username || !password, "needs a seeded database (E2E_USERNAME/E2E_PASSWORD)");

  test("create a template, add it to the pool, see it, remove it", async ({ page }) => {
    const name = `בדיקה ${Date.now()}`;

    // Sign in, then wait for the week page to fully settle.
    await page.goto("/login?lang=he");
    await page.getByLabel("שם משתמש").fill(username!);
    await page.getByLabel("סיסמה").fill(password!);
    await page.getByRole("button", { name: "כניסה" }).click();
    await expect(page.getByRole("heading", { name: "מה חשוב השבוע" })).toBeVisible();

    // Create a library template (nav via the tab link, not a hard navigation),
    // using a custom duration to exercise the preset→custom dropdown.
    await page.getByRole("link", { name: "הספרייה" }).click();
    await page.getByRole("button", { name: "סוג פעולה חדש" }).click();
    await page.getByLabel("שם", { exact: true }).fill(name);
    await page.getByLabel("משך זמן").selectOption("custom");
    await page.getByRole("spinbutton").fill("25");
    await page.getByLabel("מטרה", { exact: true }).fill("מטרת הבדיקה");
    await page.getByLabel("צעד ראשון").fill("הצעד הראשון");
    await page.getByRole("button", { name: "שמירה" }).click();
    // The saved template shows the custom 25-minute duration.
    const row = page.getByRole("listitem").filter({ hasText: name });
    await expect(row).toContainText("25");

    // Add it to this week's pool.
    await page.getByRole("link", { name: "השבוע" }).click();
    await page.getByRole("button", { name: "הוספה מהספרייה" }).click();
    await page.getByRole("button", { name: new RegExp(name) }).click();

    // The pool card is the listitem that carries this name AND an edit button
    // (distinguishes it from the still-open picker row; edit persists through the
    // delete-confirm toggle, unlike the delete label itself).
    const card = page
      .getByRole("listitem")
      .filter({ hasText: name })
      .filter({ has: page.getByRole("button", { name: "עריכה" }) });
    await expect(card).toBeVisible();

    // Delete it (two-tap confirm) — the card leaves the pool for good.
    await card.getByRole("button", { name: "מחיקה" }).click();
    await card.getByRole("button", { name: "למחוק?" }).click();
    await expect(card).toHaveCount(0);
  });

  test("an unused template can be deleted from the library", async ({ page }) => {
    const name = `למחיקה ${Date.now()}`;

    await page.goto("/login?lang=he");
    await page.getByLabel("שם משתמש").fill(username!);
    await page.getByLabel("סיסמה").fill(password!);
    await page.getByRole("button", { name: "כניסה" }).click();
    await expect(page.getByRole("heading", { name: "מה חשוב השבוע" })).toBeVisible();

    // Create a template and leave it unused.
    await page.getByRole("link", { name: "הספרייה" }).click();
    await page.getByRole("button", { name: "סוג פעולה חדש" }).click();
    await page.getByLabel("שם", { exact: true }).fill(name);
    await page.getByLabel("מטרה", { exact: true }).fill("מטרת הבדיקה");
    await page.getByLabel("צעד ראשון").fill("הצעד הראשון");
    await page.getByRole("button", { name: "שמירה" }).click();

    // Unused → offers delete (not archive). Two-step inline confirm.
    const row = page.getByRole("listitem").filter({ hasText: name });
    await expect(row.getByRole("button", { name: "ארכיון" })).toHaveCount(0);
    await row.getByRole("button", { name: "מחיקה" }).click();
    await row.getByRole("button", { name: "מחיקה" }).click();
    await expect(page.getByRole("listitem").filter({ hasText: name })).toHaveCount(0);
  });
});
