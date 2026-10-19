import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";
import { signInAsDemoFounder } from "./helpers";

const db = new PrismaClient();
test.afterAll(() => db.$disconnect());

test("redirects signed-out visitors to sign-in", async ({ page }) => {
  for (const path of ["/", "/founder/inbox", "/rep/dashboard"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/signin$/);
  }
  await expect(page.getByRole("button", { name: "Continue as the demo founder" })).toBeVisible();
});

test("first sign-in lands on onboarding; returning sign-in lands on the view's home", async ({ page }) => {
  const founder = await db.user.findFirstOrThrow({ orderBy: { createdAt: "asc" } });
  await db.user.update({ where: { id: founder.id }, data: { onboardedAt: null, currentView: "founder" } });
  try {
    await signInAsDemoFounder(page);
    await expect(page).toHaveURL(/\/onboarding$/);
    await page.getByRole("button", { name: "Skip setup for now" }).click();
    await expect(page).toHaveURL(/\/founder\/inbox$/);

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/signin$/);
    await signInAsDemoFounder(page);
    await expect(page).toHaveURL(/\/founder\/inbox$/);
  } finally {
    await db.user.update({ where: { id: founder.id }, data: { onboardedAt: founder.onboardedAt ?? new Date() } });
  }
});

test("shows the placeholder screens", async ({ page }) => {
  await signInAsDemoFounder(page);
  await page.goto("/founder/team");
  await expect(page.getByText("Coming soon")).toBeVisible();
  await expect(page.getByRole("button", { name: "Invite" })).toBeDisabled();
  await expect(page.getByText("Reps will sign in with their own account")).toBeVisible();

  await page.goto("/founder/coverage");
  await expect(page.getByText("12 founder calls")).toBeVisible();
  await page.getByRole("link", { name: /questionnaire/ }).click();
  await expect(page.getByRole("heading", { name: "Gap-filling questionnaire" })).toBeVisible();

  await page.goto("/founder/inbox");
  await expect(page.getByText("Proposals, decks and pricing documents")).toBeVisible();
});
