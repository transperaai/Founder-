import "server-only";
import { connection } from "next/server";
import { db } from "@/lib/db";

/**
 * Returns the signed-in user.
 *
 * Until real sign-in lands (issue #4), this resolves to the founder: the first
 * user in the database, which is the seeded demo founder in demo mode.
 */
export async function getCurrentUser() {
  // Per-request: never prerender a screen that depends on the user.
  await connection();
  return db.user.findFirst({ orderBy: { createdAt: "asc" } });
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("No user found. Run `npm run seed` to load the demo data.");
  }
  return user;
}
