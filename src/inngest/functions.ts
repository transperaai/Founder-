import { RetryAfterError } from "inngest";
import { importTranscript } from "@/lib/fathom/import";
import { analyseCall, markFailed } from "@/lib/pipeline";
import { events, inngest } from "./client";

const callIdOf = (data: unknown) => (data as { callId: string }).callId;
const markFailedOnFailure = async ({ event }: { event: { data: { event: { data: unknown }; error: unknown } } }) => {
  await markFailed(callIdOf(event.data.event.data), event.data.error);
};

/** Runs a call through the analysis pipeline, one Inngest step per stage. */
export const analyseCallFunction = inngest.createFunction(
  {
    id: "analyse-call",
    triggers: [{ event: events.analyseCall }],
    // One run per call at a time; a newer request waits for the current one.
    concurrency: { key: "event.data.callId", limit: 1 },
    retries: 3,
    onFailure: markFailedOnFailure,
  },
  async ({ event, step }) => analyseCall(callIdOf(event.data), { run: (name, fn) => step.run(name, fn) as never }),
);

/** Fetches a Fathom call's transcript, then hands the call to analysis (and media copy, #7). */
export const importCallFunction = inngest.createFunction(
  {
    id: "import-fathom-call",
    triggers: [{ event: events.importCall }],
    concurrency: { key: "event.data.callId", limit: 1 },
    // Fathom allows 30 transcript requests a minute; stay under it.
    throttle: { limit: 25, period: "1m" },
    retries: 4,
    onFailure: markFailedOnFailure,
  },
  async ({ event, step }) => {
    const callId = callIdOf(event.data);
    await importTranscript(callId, {
      run: (name, fn) =>
        step.run(name, async () => {
          try {
            return await fn();
          } catch (error) {
            // Fathom said when to come back: retry the step then, not on the default backoff.
            const retryAfterS = (error as { retryAfterS?: number }).retryAfterS;
            if (retryAfterS) throw new RetryAfterError("Fathom rate limit", retryAfterS * 1000);
            throw error;
          }
        }) as never,
    });
    await step.sendEvent("queue-analysis", [
      { name: events.callImported, data: { callId } },
      { name: events.analyseCall, data: { callId } },
    ]);
  },
);

export const functions = [analyseCallFunction, importCallFunction];
