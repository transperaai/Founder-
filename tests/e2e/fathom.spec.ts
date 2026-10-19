import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";
import { signInAsDemoFounder } from "./helpers";

// The app talks to tests/fake-fathom (see playwright.config.ts), which accepts
// only VALID_KEY. Imported calls then run through analysis in-process; without
// an Anthropic key the external ones end in "not configured" and the internal one is skipped.

const VALID_KEY = "fathom-test-key";
const RECORDINGS = ["9001", "9002", "9003"];
const db = new PrismaClient();

async function reset() {
  await db.call.deleteMany({ where: { fathomRecordingId: { in: RECORDINGS } } });
  await db.user.updateMany({ data: { fathomApiKey: null, fathomUseDefaultKey: true, onboardedAt: new Date(), currentView: "founder" } });
}

test.beforeEach(async ({ page }) => {
  await reset();
  await signInAsDemoFounder(page);
});

test.afterAll(async () => {
  await reset();
  await db.$disconnect();
});

test("an invalid key shows a clear error and isn't stored; a valid key is stored encrypted", async ({ page }) => {
  await page.goto("/founder/settings");
  await expect(page.getByText("Not connected")).toBeVisible();
  await page.getByRole("link", { name: "Manage your Fathom connection" }).click();

  await page.getByLabel("Fathom API key").fill("not-a-real-key");
  await page.getByRole("button", { name: "Connect Fathom" }).click();
  await expect(page.getByText("Fathom didn't accept that key")).toBeVisible();
  expect((await db.user.findFirstOrThrow()).fathomApiKey).toBeNull();

  await page.getByLabel("Fathom API key").fill(VALID_KEY);
  await page.getByRole("button", { name: "Connect Fathom" }).click();
  await expect(page.getByText("using the key you saved")).toBeVisible();
  const stored = (await db.user.findFirstOrThrow()).fathomApiKey!;
  expect(stored).toMatch(/^v1\./);
  expect(stored).not.toContain(VALID_KEY);

  await page.getByRole("button", { name: "Disconnect Fathom" }).click();
  await expect(page.getByText("Fathom disconnected.")).toBeVisible();
  expect((await db.user.findFirstOrThrow()).fathomApiKey).toBeNull();
});

test("imports only the ticked meetings, with per-call status, and never twice", async ({ page }) => {
  await page.goto("/founder/settings/fathom");
  await page.getByLabel("Fathom API key").fill(VALID_KEY);
  await page.getByRole("button", { name: "Connect Fathom" }).click();
  await page.getByRole("link", { name: "Import calls from Fathom" }).click();

  // First page has two meetings; the cursor loads the third.
  await expect(page.getByRole("checkbox", { name: /^Select (?!all)/ })).toHaveCount(2);
  await page.getByRole("button", { name: "Load more meetings" }).click();
  await expect(page.getByRole("checkbox", { name: /^Select (?!all)/ })).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Load more meetings" })).toHaveCount(0);

  await page.getByRole("checkbox", { name: "Select all" }).check();
  await page.getByRole("checkbox", { name: "Select Kestrel Foods pitch" }).uncheck();
  await page.getByRole("button", { name: "Import 2 selected" }).click();
  await expect(page.getByText("Importing 2 calls.")).toBeVisible();

  await expect.poll(() => db.call.count({ where: { fathomRecordingId: { in: RECORDINGS } } })).toBe(2);
  // Transcripts arrive, then analysis runs: the internal review is skipped, the client call needs AI.
  await expect
    .poll(async () => (await db.call.findMany({ where: { fathomRecordingId: { in: RECORDINGS } }, orderBy: { fathomRecordingId: "asc" } })).map((c) => c.status), { timeout: 20_000 })
    .toEqual(["error", "skipped"]);
  const northwind = await db.call.findUniqueOrThrow({ where: { fathomRecordingId: "9001" } });
  expect(northwind).toMatchObject({ role: "founder", clientDomain: "northwind.com", errorMessage: expect.stringContaining("AI isn't configured") });
  expect((northwind.transcript as { startS: number; endS: number }[])[0]).toMatchObject({ speaker: "Peter Hale", startS: 2, endS: 9 });

  // Already-imported meetings are marked and can't be picked again.
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Select Northwind Retail <> Brightside" })).toBeDisabled();
  await expect(page.getByRole("checkbox", { name: "Select Kestrel Foods pitch" })).toBeEnabled();
  await expect(page.getByLabel("Import progress")).toContainText("Northwind Retail <> Brightside");
});

test("onboarding: connect Fathom, then import after approving the profile", async ({ page }) => {
  await db.user.updateMany({ data: { onboardedAt: null } });
  await page.goto("/onboarding");
  await page.getByRole("link", { name: "Connect Fathom" }).click();
  await page.getByLabel("Fathom API key").fill(VALID_KEY);
  await page.getByRole("button", { name: "Connect Fathom" }).click();
  await expect(page).toHaveURL(/\/onboarding\/context$/);

  // The profile already exists from the seed; approving it moves on to the import step.
  await page.goto("/onboarding/profile");
  await page.getByRole("button", { name: "Approve and continue" }).click();
  await expect(page).toHaveURL(/\/onboarding\/import$/);
  await expect(page.getByRole("checkbox", { name: "Select Kestrel Foods pitch" })).toBeVisible();

  await page.getByRole("button", { name: "Continue to tagging" }).click();
  await expect(page).toHaveURL(/\/founder\/calls$/);
  expect((await db.user.findFirstOrThrow()).onboardedAt).not.toBeNull();
});
