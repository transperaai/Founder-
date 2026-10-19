"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { homeFor } from "@/lib/nav";
import { requireCurrentUser } from "@/lib/session";

export async function signInWith(provider: string) {
  await signIn(provider, { redirectTo: "/" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/signin" });
}

/** Finish onboarding for now; later steps (Fathom, business context) extend this flow. */
export async function completeOnboarding() {
  const user = await requireCurrentUser();
  await db.user.update({ where: { id: user.id }, data: { onboardedAt: new Date() } });
  redirect(homeFor(user.currentView));
}
