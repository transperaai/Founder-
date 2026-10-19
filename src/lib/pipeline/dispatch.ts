import "server-only";
import { after } from "next/server";
import { db } from "@/lib/db";
import { importTranscript } from "@/lib/fathom/import";
import { events, inngest, inngestEnabled } from "@/inngest/client";
import { analyseCallNow, markFailed } from ".";

// Queues background work. With Inngest configured each call runs as a retried
// background job; without it (local dev, CI) the work runs after the response is sent.

/** Queues calls for analysis. */
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

/** Queues Fathom calls for import (transcript fetch); each is analysed once imported. */
export async function requestImport(callIds: string[]) {
  if (callIds.length === 0) return;
  await db.call.updateMany({ where: { id: { in: callIds } }, data: { status: "importing", errorMessage: null } });
  if (inngestEnabled()) {
    await inngest.send(callIds.map((callId) => ({ name: events.importCall, data: { callId } })));
    return;
  }
  after(async () => {
    for (const callId of callIds) {
      try {
        await importTranscript(callId);
      } catch (error) {
        await markFailed(callId, error);
        continue;
      }
      await analyseCallNow(callId);
    }
  });
}
