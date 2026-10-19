import "server-only";
import type { CallType } from "@prisma/client";
import { runStep, type LlmClient } from "@/lib/ai/harness";
import { emailDomain, isInternalCall } from "@/lib/calls/domain";
import { firstSeconds, formatTurns, normaliseTurns, type Turn } from "@/lib/calls/transcript";
import { db } from "@/lib/db";
import { classifyCallPrompt } from "@/prompts/classify-call";
import { segmentMomentsPrompt } from "@/prompts/segment-moments";
import { momentRows } from "./moments";
import { classificationSchema, segmentationSchema } from "./schemas";

// The analysis pipeline: normalise → classify → segment, then the founder or
// rep path (later tickets). Each stage is idempotent, so a stage can be retried
// or the whole pipeline re-run without duplicating anything.

/** Runs one named stage. Inngest passes `step.run` so stages are retried and memoised. */
export type StepRunner = <T>(name: string, fn: () => Promise<T>) => Promise<T>;
const runInline: StepRunner = (_name, fn) => fn();

export type PipelineDeps = { client?: LlmClient; run?: StepRunner };

const OPENING_SECONDS = 10 * 60;

/** The pipeline entry point. Returns the call's final status; throws if a stage fails. */
export async function analyseCall(callId: string, { client, run = runInline }: PipelineDeps = {}) {
  await run("start", () => db.call.update({ where: { id: callId }, data: { status: "analysing", errorMessage: null } }).then(() => null));
  await run("normalise", () => normalise(callId));

  const callType = await run("classify", () => classify(callId, client));
  if (callType === "internal") {
    await run("skip", () => skip(callId));
    return "skipped" as const;
  }

  await run("segment", () => segment(callId, callType, client));
  // Founder path (#10) and rep path (#9, #11) hang off here.
  await run("finish", () => db.call.update({ where: { id: callId }, data: { status: "ready" } }).then(() => null));
  return "ready" as const;
}

/** Runs the pipeline now and records any failure on the call instead of throwing. */
export async function analyseCallNow(callId: string, deps: PipelineDeps = {}) {
  try {
    return await analyseCall(callId, deps);
  } catch (error) {
    await markFailed(callId, error);
    return "error" as const;
  }
}

/** A failure whose message is safe and useful to show the founder. */
export class PipelineError extends Error {
  name = "PipelineError";
}

const failureMessages: Record<string, string> = {
  not_configured: "AI isn't configured on this deployment (no Anthropic API key).",
  invalid_output: "The analysis returned something we couldn't read. Retry usually fixes this.",
  refusal: "The model declined to analyse this call.",
  api_error: "The AI service didn't respond. Try again in a minute.",
};

/**
 * The message to show for a failure. Errors may arrive serialised from Inngest
 * (possibly wrapped as a cause), so this goes by name and code, not class.
 */
function describeFailure(error: unknown): { code: string; message: string } {
  for (let e = error, depth = 0; e && typeof e === "object" && depth < 3; e = (e as { cause?: unknown }).cause, depth++) {
    const { code, name, message } = e as { code?: unknown; name?: unknown; message?: unknown };
    if (typeof code === "string" && code in failureMessages) return { code, message: failureMessages[code] };
    if (name === "PipelineError" && typeof message === "string") return { code: "pipeline", message };
  }
  return { code: "unexpected", message: "Analysis failed unexpectedly. Retry, and check the server logs if it fails again." };
}

/** Puts the call in the error state with a message safe to show (never client data). */
export async function markFailed(callId: string, error: unknown) {
  const { code, message } = describeFailure(error);
  console.error(`analysis failed for call ${callId}: ${code}`);
  await db.call.updateMany({ where: { id: callId }, data: { status: "error", errorMessage: message } });
}

async function normalise(callId: string) {
  const call = await db.call.findUniqueOrThrow({ where: { id: callId }, select: { transcript: true } });
  let normalised;
  try {
    normalised = normaliseTurns(call.transcript);
  } catch {
    throw new PipelineError("The transcript isn't in a format we can read.");
  }
  const { turns, changed } = normalised;
  if (turns.length === 0) throw new PipelineError("The call has no transcript to analyse.");
  if (changed) await db.call.update({ where: { id: callId }, data: { transcript: turns } });
  return null;
}

async function founderDomain() {
  const founder = await db.user.findFirst({ orderBy: { createdAt: "asc" }, select: { email: true } });
  return founder ? emailDomain(founder.email) : null;
}

async function classify(callId: string, client?: LlmClient): Promise<CallType> {
  const call = await db.call.findUniqueOrThrow({ where: { id: callId } });
  // The founder's choice in the calls table wins.
  if (call.callTypeOverridden && call.callType) return call.callType;

  if (isInternalCall(call.attendeeEmails, await founderDomain())) {
    await db.call.update({ where: { id: callId }, data: { callType: "internal" } });
    return "internal";
  }

  const context = await db.businessContext.findFirst({ where: { approvedAt: { not: null } }, orderBy: { version: "desc" } });
  const profile = context?.profileSummary as Record<string, string> | null;
  const { output } = await runStep({
    step: "classify_call",
    prompt: classifyCallPrompt,
    vars: {
      title: call.title,
      opening: formatTurns(firstSeconds(call.transcript as Turn[], OPENING_SECONDS)),
      businessSummary: profile ? `Offer: ${profile.offer}\nIdeal clients: ${profile.idealClients}` : null,
    },
    schema: classificationSchema,
    callId,
    maxTokens: 1000,
    client,
  });
  await db.call.update({ where: { id: callId }, data: { callType: output.callType } });
  return output.callType;
}

async function skip(callId: string) {
  // An internal call has nothing to coach or learn from: drop anything a previous run derived.
  await db.$transaction([
    db.moment.deleteMany({ where: { callId } }),
    db.call.update({ where: { id: callId }, data: { status: "skipped" } }),
  ]);
  return null;
}

async function segment(callId: string, callType: CallType, client?: LlmClient) {
  const call = await db.call.findUniqueOrThrow({ where: { id: callId } });
  const turns = call.transcript as Turn[];
  const { output } = await runStep({
    step: "segment_moments",
    prompt: segmentMomentsPrompt,
    vars: { title: call.title, callType, transcript: formatTurns(turns) },
    schema: segmentationSchema,
    callId,
    client,
  });
  const rows = momentRows(output.moments, turns, callType, call.durationS);
  // Replace, never append: re-running the pipeline must not duplicate moments.
  await db.$transaction([
    db.moment.deleteMany({ where: { callId } }),
    db.moment.createMany({ data: rows.map((m) => ({ ...m, callId })) }),
  ]);
  return rows.length;
}
