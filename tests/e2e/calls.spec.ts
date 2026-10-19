import { PrismaClient } from "@prisma/client";
import { expect, test, type Page } from "@playwright/test";
import { signInAsDemoFounder } from "./helpers";

// Runs without ANTHROPIC_API_KEY or Inngest: analysis runs in-process after the
// response, so a call that needs the model fails with "not configured" while an
// internal call is skipped without one. The pipeline itself is tested with a fake model.

const db = new PrismaClient();
const created: string[] = [];

async function createCall(title: string, attendeeEmails: string[], data: Record<string, unknown> = {}) {
  const call = await db.call.create({
    data: {
      source: "fathom",
      title,
      startedAt: new Date(),
      durationS: 600,
      transcript: [
        { speaker: "Peter Hale", email: "peter@brightside.agency", startS: 0, endS: 10, text: "Morning, shall we start?" },
        { speaker: "Someone", email: attendeeEmails[1], startS: 11, endS: 20, text: "Yes, let's." },
      ],
      attendeeEmails,
      role: "founder",
      status: "error",
      errorMessage: "The AI service didn't respond. Try again in a minute.",
      ...data,
    },
  });
  created.push(call.id);
  return call;
}

const row = (page: Page, title: string) => page.getByRole("row").filter({ hasText: title });

test.beforeEach(async ({ page }) => {
  await signInAsDemoFounder(page);
});

test.afterAll(async () => {
  await db.call.deleteMany({ where: { id: { in: created } } });
  await db.$disconnect();
});

test("lists every call with its tags; rep view lists rep calls only", async ({ page }) => {
  await page.goto("/founder/calls");
  await expect(page.getByText("In the full version this will be automated.")).toBeVisible();
  const founderCount = await db.call.count();
  await expect(page.getByRole("row")).toHaveCount(founderCount + 1);
  const seeded = row(page, "Northwind Retail");
  await expect(seeded.first().getByLabel("Call type")).toBeVisible();

  await page.goto("/rep/calls");
  const repCount = await db.call.count({ where: { role: "rep" } });
  await expect(page.getByRole("row")).toHaveCount(repCount + 1);
});

test("Retry re-runs a failed call: an internal call is skipped without the model", async ({ page }) => {
  await createCall("E2E internal standup", ["peter@brightside.agency", "sam@brightside.agency"]);
  await page.goto("/founder/calls");
  const r = row(page, "E2E internal standup");
  await expect(r.getByText("The AI service didn't respond")).toBeVisible();

  await r.getByRole("button", { name: "Retry" }).click();
  await expect(r.getByText("Skipped")).toBeVisible({ timeout: 15_000 });
  await expect(r.getByLabel("Call type")).toHaveValue("internal");
});

test("Retry on an external call without AI configured shows the reason", async ({ page }) => {
  await createCall("E2E external intro", ["peter@brightside.agency", "dana@northwind.com"]);
  await page.goto("/founder/calls");
  const r = row(page, "E2E external intro");
  await r.getByRole("button", { name: "Retry" }).click();
  await expect(r.getByText("AI isn't configured")).toBeVisible({ timeout: 15_000 });
});

test("editing outcome, role and type saves inline", async ({ page }) => {
  const call = await createCall("E2E tagging call", ["peter@brightside.agency", "dana@northwind.com"], { status: "ready", errorMessage: null, callType: "discovery" });
  await page.goto("/founder/calls");
  const r = row(page, "E2E tagging call");

  await r.getByLabel("Outcome").selectOption("won");
  await expect.poll(async () => (await db.call.findUniqueOrThrow({ where: { id: call.id } })).outcome).toBe("won");
  await r.getByLabel("Role").selectOption("rep");
  await expect.poll(async () => (await db.call.findUniqueOrThrow({ where: { id: call.id } })).role).toBe("rep");

  // Overriding the type re-runs analysis; "internal" needs no model, so it ends skipped.
  await r.getByLabel("Call type").selectOption("internal");
  await expect(r.getByText("Skipped")).toBeVisible({ timeout: 15_000 });
  expect(await db.call.findUniqueOrThrow({ where: { id: call.id } })).toMatchObject({ callType: "internal", callTypeOverridden: true });
});

test("deleting a call asks for confirmation, then removes it", async ({ page }) => {
  const call = await createCall("E2E call to delete", ["peter@brightside.agency", "dana@northwind.com"]);
  await page.goto("/founder/calls");
  const r = row(page, "E2E call to delete");

  await r.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("dialog")).toContainText("This can't be undone");
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(r).toBeVisible();

  await r.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete call" }).click();
  await expect.poll(() => db.call.findUnique({ where: { id: call.id } })).toBeNull();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("E2E call to delete")).toHaveCount(0);
});

test("a call's detail page shows its scorecard with playable evidence", async ({ page }) => {
  const call = await db.call.findFirstOrThrow({ where: { title: "Atlas Logistics – discovery" }, include: { scorecard: true } });
  await page.goto("/founder/calls");
  await page.getByRole("link", { name: "Atlas Logistics – discovery" }).click();
  await expect(page).toHaveURL(new RegExp(`/founder/calls/${call.id}$`));

  await expect(page.getByText("Scorecard")).toBeVisible();
  await expect(page.getByText("Founder benchmark")).toBeVisible();
  const habits = page.getByRole("list", { name: "Habits" }).getByRole("listitem");
  await expect(habits).toHaveCount((call.scorecard!.habitResults as unknown[]).length);
  await expect(habits.filter({ hasText: "H6 ·" })).toContainText("Client talked");

  // Evidence plays as a time range of the call's recording. (Headless Chromium can't decode the demo MP4, so this checks the wiring.)
  await expect(page.getByLabel("Call recording")).toHaveAttribute("src", call.mediaUrl!);
  await expect(page.getByRole("button", { name: /^Play H\d+ evidence at \d+:\d\d$/ }).first()).toBeEnabled();
});
