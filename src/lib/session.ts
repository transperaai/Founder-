import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/** The signed-in user, or null. */
export async function getCurrentUser() {
  const session = await auth();
  const id = session?.user?.id;
  return id ? db.user.findUnique({ where: { id } }) : null;
}

/** The signed-in user; redirects to sign-in otherwise. */
export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return user;
}

/** The signed-in user who has been through onboarding; redirects otherwise. */
export async function requireOnboardedUser() {
  const user = await requireCurrentUser();
  if (!user.onboardedAt) redirect("/onboarding");
  return user;
}
