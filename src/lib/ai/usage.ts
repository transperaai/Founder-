import "server-only";
import { db } from "@/lib/db";
import type { UsageRecorder } from "./harness";

/** Logs model tokens per call and step so EQHQ can estimate cost per rep. */
export const recordModelUsage: UsageRecorder = async (usage) => {
  await db.modelUsage.create({ data: usage });
};
