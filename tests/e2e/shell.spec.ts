import { expect, test } from "@playwright/test";

test("switches between Founder and Rep view, persisting the choice", async ({ page }) => {
  await page.goto("/founder/inbox");
  await expect(page.getByRole("heading", { name: "Inbox" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" }).first().getByRole("link", { name: "Settings" })).toBeVisible();

  await page.getByRole("button", { name: "Rep view" }).click();
  await expect(page).toHaveURL(/\/rep\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  // The root redirects to the persisted view's home.
  await page.goto("/");
  await expect(page).toHaveURL(/\/rep\/dashboard$/);

  await page.getByRole("button", { name: "Founder view" }).click();
  await expect(page).toHaveURL(/\/founder\/inbox$/);
});

test("every nav item in both views renders a page", async ({ page }) => {
  for (const home of ["/founder/inbox", "/rep/dashboard"]) {
    await page.goto(home);
    const nav = page.getByRole("navigation", { name: "Main" }).first();
    const hrefs = await nav.getByRole("link").evaluateAll((links) => links.map((l) => l.getAttribute("href")!));
    for (const href of hrefs) {
      const res = await page.goto(href);
      expect(res?.status(), href).toBe(200);
      await expect(page.locator("h1")).toBeVisible();
    }
  }
});
