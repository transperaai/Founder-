import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";
import { signInAsDemoFounder } from "./helpers";

// Runs without ANTHROPIC_API_KEY, so profile drafting reports "not configured"
// and the founder writes the profile by hand. The harness itself is unit-tested
// with a fake model client.

const db = new PrismaClient();
let baselineVersion = 0;

test.beforeAll(async () => {
  baselineVersion = (await db.businessContext.aggregate({ _max: { version: true } }))._max.version ?? 0;
});

test.afterAll(async () => {
  await db.businessContext.deleteMany({ where: { version: { gt: baselineVersion } } });
  await db.user.updateMany({ data: { onboardedAt: new Date(), currentView: "founder" } });
  await db.$disconnect();
});

test("onboarding: placeholder, five questions, edit and approve the profile", async ({ page }) => {
  await db.user.updateMany({ data: { onboardedAt: null, currentView: "founder" } });
  await signInAsDemoFounder(page);
  await expect(page).toHaveURL(/\/onboarding$/);

  await page.getByRole("link", { name: "Start with your business" }).click();
  await expect(page.getByText("Business context extraction")).toBeVisible();
  await expect(page.getByText("Coming soon")).toBeVisible();

  await page.getByRole("link", { name: "Answer five questions" }).click();
  const answers = ["Retail brands", "Ecommerce sites, £40k projects", "We measure repeat revenue", "Intro, discovery, proposal", "Budget timing"];
  const questions = page.getByRole("textbox");
  for (const [i, answer] of answers.entries()) await questions.nth(i).fill(answer);
  await page.getByRole("button", { name: "Create my profile" }).click();

  await expect(page).toHaveURL(/\/onboarding\/profile\?error=not_configured/);
  await expect(page.getByText("AI isn't configured")).toBeVisible();
  await expect(page.getByText(`Version ${baselineVersion + 1}`)).toBeVisible();

  for (const label of ["Ideal clients", "Offer", "Differentiators", "Sales process", "Common objections"]) {
    await page.getByLabel(label).fill(`${label} written by hand`);
  }
  await page.getByRole("button", { name: "Approve and continue" }).click();
  await expect(page).toHaveURL(/\/founder\/inbox$/);

  const approved = await db.businessContext.findFirstOrThrow({ where: { version: baselineVersion + 1 } });
  expect(approved.approvedAt).not.toBeNull();
  expect(approved.answers).toMatchObject({ bestClients: "Retail brands" });
});

test("settings: editing an approved profile creates a new version", async ({ page }) => {
  await signInAsDemoFounder(page);
  await page.goto("/founder/settings");
  await page.getByRole("link", { name: "View and edit your business profile" }).click();

  const before = (await db.businessContext.aggregate({ _max: { version: true } }))._max.version!;
  await page.getByLabel("Offer").fill("Retention programmes only");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByText("Saved.")).toBeVisible();
  await expect(page.getByText(`Version ${before + 1}`)).toBeVisible();
  await expect(page.getByText(`v${before} · approved`)).toBeVisible();
  const latest = await db.businessContext.findFirstOrThrow({ orderBy: { version: "desc" } });
  expect(latest.profileSummary).toMatchObject({ offer: "Retention programmes only" });
});
