import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const FAKE_FATHOM_PORT = 3101;

// Runs against a seeded database: `npm run seed:reset` first.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  // Tests share one seeded database, so run them one at a time.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      // Stands in for api.fathom.ai, serving tests/fake-fathom/fixtures.json.
      command: `npx tsx tests/fake-fathom/server.ts`,
      url: `http://127.0.0.1:${FAKE_FATHOM_PORT}/external/v1/health`,
      env: { FAKE_FATHOM_PORT: String(FAKE_FATHOM_PORT) },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npm run dev -- --port ${PORT}`,
      url: `http://localhost:${PORT}`,
      // The app talks to the fake Fathom, never the real one, and has no default key.
      env: { FATHOM_API_BASE_URL: `http://127.0.0.1:${FAKE_FATHOM_PORT}/external/v1`, FATHOM_API_KEY: "" },
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
