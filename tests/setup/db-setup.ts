import { afterAll, beforeEach, vi } from "vitest";
import { db } from "@/lib/db";

vi.mock("server-only", () => ({}));

// Each test starts from empty tables.
beforeEach(async () => {
  const tables = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  await db.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} CASCADE`);
});

afterAll(async () => {
  await db.$disconnect();
});
