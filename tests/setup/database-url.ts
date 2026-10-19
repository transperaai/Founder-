import "dotenv/config";

/** TEST_DATABASE_URL, or DATABASE_URL with the database renamed to founder_test. Never the dev database. */
export function testDatabaseUrl() {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const base = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/founder";
  const url = new URL(base);
  url.pathname = "/founder_test";
  return url.toString();
}
