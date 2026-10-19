"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { createFathomClient, FathomError } from "@/lib/fathom/client";
import { createImportedCalls } from "@/lib/fathom/import";
import { founderFathomClient } from "@/lib/fathom/key";
import { meetingSummary, type MeetingSummary } from "@/lib/fathom/mapping";
import { homeFor } from "@/lib/nav";
import { requestImport } from "@/lib/pipeline/dispatch";
import { requireCurrentUser } from "@/lib/session";

type Flow = "onboarding" | "settings";
const keyPath = (flow: Flow) => (flow === "onboarding" ? "/onboarding/fathom" : "/founder/settings/fathom");
const afterConnect = (flow: Flow) => (flow === "onboarding" ? "/onboarding/context" : "/founder/settings/fathom?saved=1");

/** Validates a pasted key with a cheap GET /meetings, then stores it encrypted. An invalid key is never stored. */
export async function saveFathomKey(flow: Flow, form: FormData) {
  const user = await requireCurrentUser();
  const apiKey = String(form.get("apiKey") ?? "").trim();
  if (!apiKey) redirect(`${keyPath(flow)}?error=empty`);

  try {
    await createFathomClient({ apiKey }).listMeetings();
  } catch (error) {
    if (!(error instanceof FathomError)) throw error;
    redirect(`${keyPath(flow)}?error=${error.code}`);
  }
  await db.user.update({ where: { id: user.id }, data: { fathomApiKey: encrypt(apiKey), fathomUseDefaultKey: true } });
  revalidatePath("/founder/settings");
  redirect(afterConnect(flow));
}

/** Disconnects Fathom: forgets the saved key and stops using the deployment default. */
export async function removeFathomKey() {
  const user = await requireCurrentUser();
  await db.user.update({ where: { id: user.id }, data: { fathomApiKey: null, fathomUseDefaultKey: false } });
  revalidatePath("/founder/settings");
  redirect("/founder/settings/fathom?removed=1");
}

/** Goes back to the deployment's FATHOM_API_KEY. */
export async function useDefaultFathomKey() {
  const user = await requireCurrentUser();
  await db.user.update({ where: { id: user.id }, data: { fathomApiKey: null, fathomUseDefaultKey: true } });
  revalidatePath("/founder/settings");
  redirect("/founder/settings/fathom?saved=1");
}

export type MeetingOption = MeetingSummary & { imported: boolean };
export type MeetingPage = { meetings: MeetingOption[]; nextCursor: string | null; error: string | null };

/** One page of the founder's Fathom meetings, each marked if it's already imported. */
export async function listFathomMeetings(cursor?: string): Promise<MeetingPage> {
  await requireCurrentUser();
  const fathom = await founderFathomClient();
  if (!fathom) return { meetings: [], nextCursor: null, error: "Fathom isn't connected." };
  try {
    const page = await fathom.listMeetings({ cursor });
    const meetings = page.meetings.map(meetingSummary);
    const imported = new Set(
      (
        await db.call.findMany({
          where: { fathomRecordingId: { in: meetings.map((m) => m.recordingId) } },
          select: { fathomRecordingId: true },
        })
      ).map((c) => c.fathomRecordingId),
    );
    return { meetings: meetings.map((m) => ({ ...m, imported: imported.has(m.recordingId) })), nextCursor: page.nextCursor, error: null };
  } catch (error) {
    if (!(error instanceof FathomError)) throw error;
    return { meetings: [], nextCursor: null, error: error.message };
  }
}

const meetingSchema = z.object({
  recordingId: z.string().regex(/^\d+$/),
  title: z.string().max(500),
  startedAt: z.iso.datetime(),
  durationS: z.number().int().nonnegative(),
  attendeeEmails: z.array(z.string().max(320)).max(200),
});

/** Imports only the ticked meetings. Already-imported ones are skipped. */
export async function importFathomMeetings(meetings: MeetingSummary[]) {
  await requireCurrentUser();
  const selected = z.array(meetingSchema).max(500).parse(meetings);
  const callIds = await createImportedCalls(selected);
  await requestImport(callIds);
  revalidatePath("/founder/calls");
  return { imported: callIds.length, skipped: selected.length - callIds.length };
}

/** Last onboarding step: done importing, go tag the calls. */
export async function finishOnboardingImport() {
  const user = await requireCurrentUser();
  await db.user.update({ where: { id: user.id }, data: { onboardedAt: user.onboardedAt ?? new Date() } });
  redirect(user.currentView === "founder" ? "/founder/calls" : homeFor(user.currentView));
}
