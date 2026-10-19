"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { deleteCall as deleteCallAndDerived } from "@/lib/calls/delete";
import { db } from "@/lib/db";
import { requestAnalysis } from "@/lib/pipeline/dispatch";
import { requireCurrentUser } from "@/lib/session";

const tagSchema = z.discriminatedUnion("field", [
  z.object({ field: z.literal("callType"), value: z.enum(["discovery", "pitch", "account_review", "negotiation", "internal"]) }),
  z.object({ field: z.literal("outcome"), value: z.enum(["won", "lost", "open"]) }),
  z.object({ field: z.literal("role"), value: z.enum(["founder", "rep"]) }),
]);

function revalidateCalls() {
  revalidatePath("/founder/calls");
  revalidatePath("/rep/calls");
}

/** Sets a call's type, outcome or role. Overriding the type re-runs the pipeline with the founder's choice. */
export async function setCallTag(callId: string, field: string, value: string) {
  await requireCurrentUser();
  const tag = tagSchema.parse({ field, value });
  if (tag.field === "callType") {
    await db.call.update({ where: { id: callId }, data: { callType: tag.value, callTypeOverridden: true } });
    await requestAnalysis([callId]);
  } else {
    await db.call.update({ where: { id: callId }, data: { [tag.field]: tag.value } });
  }
  revalidateCalls();
}

export async function retryCall(callId: string) {
  await requireCurrentUser();
  await requestAnalysis([callId]);
  revalidateCalls();
}

export async function deleteCall(callId: string) {
  await requireCurrentUser();
  await deleteCallAndDerived(callId);
  revalidateCalls();
}
