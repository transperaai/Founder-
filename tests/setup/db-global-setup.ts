import { execSync } from "node:child_process";
import { testDatabaseUrl } from "./database-url";

/** Creates (if needed) and migrates the test database once per run. */
export default function setup() {
  const url = testDatabaseUrl();
  execSync("npx prisma migrate deploy", { stdio: "pipe", env: { ...process.env, DATABASE_URL: url, DATABASE_URL_UNPOOLED: url } });
}
