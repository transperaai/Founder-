import "server-only";
import { db } from "@/lib/db";
import { founderDomain } from "@/lib/founder";
import { PipelineError, type StepRunner } from "@/lib/pipeline";
import type { FathomClient } from "./client";
import { founderFathomClient } from "./key";
import { callFromSummary, fathomTurns, type MeetingSummary } from "./mapping";

/**
 * Creates a Call (status importing, role founder) for each selected meeting.
 * Meetings already imported are skipped, so importing twice never duplicates.
 * Returns the ids of the calls created.
 */
export async function createImportedCalls(meetings: MeetingSummary[]) {
  const domain = await founderDomain();
  const ids = meetings.map((m) => m.recordingId);
  const existing = new Set(
    (await db.call.findMany({ where: { fathomRecordingId: { in: ids } }, select: { fathomRecordingId: true } })).map((c) => c.fathomRecordingId),
  );
  const fresh = meetings.filter((m) => !existing.has(m.recordingId));
  await db.call.createMany({
    data: fresh.map((m) => ({ ...callFromSummary(m, domain), role: "founder" as const })),
    skipDuplicates: true,
  });
  const created = await db.call.findMany({
    where: { fathomRecordingId: { in: fresh.map((m) => m.recordingId) }, status: "importing" },
    select: { id: true },
  });
  return created.map((c) => c.id);
}

const runInline: StepRunner = (_name, fn) => fn();

/**
 * Fetches a call's transcript from Fathom and stores it as normalised turns.
 * Idempotent: re-running overwrites the same call's transcript.
 */
export async function importTranscript(callId: string, { fathom, run = runInline }: { fathom?: FathomClient; run?: StepRunner } = {}) {
  await run("fetch-transcript", async () => {
    const call = await db.call.findUniqueOrThrow({ where: { id: callId }, select: { fathomRecordingId: true, durationS: true } });
    if (!call.fathomRecordingId) throw new PipelineError("This call didn't come from Fathom.");
    const client = fathom ?? (await founderFathomClient());
    if (!client) throw new PipelineError("Fathom isn't connected. Add your API key in Settings, then retry.");

    const turns = fathomTurns(await client.getTranscript(call.fathomRecordingId), call.durationS);
    if (turns.length === 0) throw new PipelineError("Fathom has no transcript for this meeting yet. Retry once it has processed.");
    await db.call.update({ where: { id: callId }, data: { transcript: turns, status: "importing", errorMessage: null } });
    return null;
  });
}

/** A Fathom call whose transcript hasn't arrived yet: Retry should import, not analyse. */
export const needsImport = (call: { source: string; transcript: unknown }) =>
  call.source === "fathom" && Array.isArray(call.transcript) && call.transcript.length === 0;
