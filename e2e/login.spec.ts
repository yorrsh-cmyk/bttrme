import { expect, test } from "@playwright/test";

// RTL smoke + login flows (plan §6). The unauthenticated checks run anywhere;
// the credential flows need a seeded database (E2E_USERNAME/E2E_PASSWORD set).

test.describe("login screen", () => {
  test("unauthenticated visit redirects to /login", async ({ page }) => {
    await page.goto("/week");
    await expect(page).toHaveURL(/\/login/);
  });

  test("renders Hebrew RTL by default", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("main")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("main")).toHaveAttribute("lang", "he");
    await expect(page.getByRole("button", { name: "כניסה" })).toBeVisible();
  });

  test("language toggle switches to English LTR", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "English" }).click();
    await expect(page.locator("main")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });
});

const username = process.env.E2E_USERNAME;
const password = process.env.E2E_PASSWORD;

test.describe("credential flows", () => {
  test.skip(!username || !password, "needs a seeded database (E2E_USERNAME/E2E_PASSWORD)");

  test("wrong password shows a neutral message and stays put", async ({ page }) => {
    await page.goto("/login?lang=he");
    await page.getByLabel("שם משתמש").fill(username!);
    await page.getByLabel("סיסמה").fill("definitely-not-it");
    await page.getByRole("button", { name: "כניסה" }).click();
    await expect(page.getByRole("status")).toContainText("לא תואמים");
    await expect(page).toHaveURL(/\/login/);
  });

  test("signs in in Hebrew and lands on This Week", async ({ page }) => {
    await page.goto("/login?lang=he");
    await page.getByLabel("שם משתמש").fill(username!);
    await page.getByLabel("סיסמה").fill(password!);
    await page.getByRole("button", { name: "כניסה" }).click();
    await expect(page).toHaveURL(/\/week/);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("navigation")).toContainText("השבוע");
  });
});
