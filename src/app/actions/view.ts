"use server";

import { redirect } from "next/navigation";
import type { View } from "@prisma/client";
import { db } from "@/lib/db";
import { homeFor } from "@/lib/nav";
import { requireCurrentUser } from "@/lib/session";

export async function switchView(view: View) {
  const user = await requireCurrentUser();
  await db.user.update({ where: { id: user.id }, data: { currentView: view } });
  redirect(homeFor(view));
}
