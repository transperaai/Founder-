import "server-only";
import { after } from "next/server";
import { db } from "@/lib/db";
import { events, inngest, inngestEnabled } from "@/inngest/client";
import { analyseCallNow } from ".";

/**
 * Queues calls for analysis. With Inngest configured each call runs as a
 * retried background job; without it (local dev, CI) the pipeline runs after
 * the response is sent.
 */
export async function requestAnalysis(callIds: string[]) {
  if (callIds.length === 0) return;
  await db.call.updateMany({ where: { id: { in: callIds } }, data: { status: "analysing", errorMessage: null } });
  if (inngestEnabled()) {
    await inngest.send(callIds.map((callId) => ({ name: events.analyseCall, data: { callId } })));
    return;
  }
  after(async () => {
    for (const callId of callIds) await analyseCallNow(callId);
  });
}
