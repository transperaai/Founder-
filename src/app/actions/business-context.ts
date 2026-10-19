"use server";

import { redirect } from "next/navigation";
import { AiStepError, runStep } from "@/lib/ai/harness";
import {
  answersFromForm,
  profileFromForm,
  profileSaveAction,
  profileSchema,
  type BusinessProfile,
} from "@/lib/business-context";
import { db } from "@/lib/db";
import { homeFor } from "@/lib/nav";
import { requireCurrentUser } from "@/lib/session";
import { businessProfilePrompt } from "@/prompts/business-profile";

type Flow = "onboarding" | "settings";
const profilePath = (flow: Flow) => (flow === "onboarding" ? "/onboarding/profile" : "/founder/settings/business-context");

/** Saves the five answers as a new version and asks the model for a profile card. */
export async function submitAnswers(flow: Flow, form: FormData) {
  await requireCurrentUser();
  const answers = answersFromForm(form);
  const latest = await db.businessContext.findFirst({ orderBy: { version: "desc" } });
  const context = await db.businessContext.create({ data: { version: (latest?.version ?? 0) + 1, answers } });

  let error: string | null = null;
  try {
    const { output, promptVersion } = await runStep({
      step: "business_profile",
      prompt: businessProfilePrompt,
      vars: { answers },
      schema: profileSchema,
    });
    await db.businessContext.update({ where: { id: context.id }, data: { profileSummary: output, promptVersion } });
  } catch (e) {
    if (!(e instanceof AiStepError)) throw e;
    console.error(`business_profile failed: ${e.code}`);
    error = e.code;
  }
  redirect(error ? `${profilePath(flow)}?error=${error}` : profilePath(flow));
}

/** Saves edits to the latest profile and approves it. Editing an approved profile creates a new version. */
export async function approveProfile(flow: Flow, form: FormData) {
  const user = await requireCurrentUser();
  const latest = await db.businessContext.findFirst({ orderBy: { version: "desc" } });
  if (!latest) redirect(flow === "onboarding" ? "/onboarding/business" : "/founder/settings/business-context/questions");

  const edited = profileFromForm(form);
  const now = new Date();
  const current = { approvedAt: latest.approvedAt, profileSummary: latest.profileSummary as BusinessProfile | null };
  switch (profileSaveAction(current, edited)) {
    case "update":
      await db.businessContext.update({ where: { id: latest.id }, data: { profileSummary: edited, approvedAt: now } });
      break;
    case "new_version":
      await db.businessContext.create({
        data: { version: latest.version + 1, answers: latest.answers ?? {}, profileSummary: edited, approvedAt: now, promptVersion: "edited" },
      });
      break;
    case "approve_only":
      break;
  }

  if (flow === "onboarding") {
    await db.user.update({ where: { id: user.id }, data: { onboardedAt: user.onboardedAt ?? now } });
    redirect(homeFor(user.currentView));
  }
  redirect("/founder/settings/business-context?saved=1");
}
