import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { testDatabaseUrl } from "./tests/setup/database-url";

const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };

export default defineConfig({
  resolve: { alias },
  test: {
    environment: "node",
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          include: ["src/**/*.test.ts", "prisma/**/*.test.ts"],
          exclude: ["**/*.db.test.ts"],
          environment: "node",
        },
      },
      {
        // Tests that read and write Postgres: a separate database, migrated once, files run one at a time.
        resolve: { alias },
        test: {
          name: "db",
          include: ["src/**/*.db.test.ts"],
          environment: "node",
          globalSetup: ["tests/setup/db-global-setup.ts"],
          setupFiles: ["tests/setup/db-setup.ts"],
          env: { DATABASE_URL: testDatabaseUrl(), DATABASE_URL_UNPOOLED: testDatabaseUrl() },
          fileParallelism: false,
        },
      },
    ],
  },
});
