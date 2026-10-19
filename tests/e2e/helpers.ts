import { expect, type Page } from "@playwright/test";

/** Signs in with the demo founder (requires DEMO_MODE=true). */
export async function signInAsDemoFounder(page: Page) {
  await page.goto("/signin");
  await page.getByRole("button", { name: "Continue as the demo founder" }).click();
  await expect(page).not.toHaveURL(/\/signin/);
}
