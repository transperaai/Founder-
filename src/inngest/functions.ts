import { analyseCall, markFailed } from "@/lib/pipeline";
import { events, inngest } from "./client";

/** Runs a call through the analysis pipeline, one Inngest step per stage. */
export const analyseCallFunction = inngest.createFunction(
  {
    id: "analyse-call",
    triggers: [{ event: events.analyseCall }],
    // One run per call at a time; a newer request waits for the current one.
    concurrency: { key: "event.data.callId", limit: 1 },
    retries: 3,
    onFailure: async ({ event }) => {
      const callId = (event.data.event.data as { callId: string }).callId;
      await markFailed(callId, event.data.error);
    },
  },
  async ({ event, step }) => {
    const callId = (event.data as { callId: string }).callId;
    return analyseCall(callId, { run: (name, fn) => step.run(name, fn) as never });
  },
);

export const functions = [analyseCallFunction];
