import { z } from "zod/v4";

export const SALES_CALL_TYPES = ["discovery", "pitch", "account_review", "negotiation"] as const;
export const MOMENT_TYPES = [
  "opening",
  "discovery_question",
  "client_need",
  "objection",
  "pricing",
  "value_story",
  "buying_signal",
  "decision",
  "next_steps",
  "small_talk",
] as const;

export const classificationSchema = z.object({
  callType: z.enum(SALES_CALL_TYPES),
  reason: z.string(),
});

export const segmentationSchema = z.object({
  moments: z.array(
    z.object({
      type: z.enum(MOMENT_TYPES),
      startS: z.number(),
      endS: z.number(),
      speaker: z.string(),
      summary: z.string(),
    }),
  ),
});
export type SegmentedMoment = z.infer<typeof segmentationSchema>["moments"][number];

export const AWARENESS_LEVELS = ["unaware", "problem_aware", "solution_aware", "product_aware", "most_aware"] as const;

/**
 * Scoring output for one call: habit codes and moment labels are limited to
 * this call's, and a habit marked done must cite an evidence moment.
 */
export function scorecardSchema(habitCodes: string[], momentLabels: string[]) {
  const habitCode = habitCodes.length ? z.enum(habitCodes as [string, ...string[]]) : z.string();
  const evidenceMoment = momentLabels.length ? z.enum(momentLabels as [string, ...string[]]).nullable() : z.null();
  return z.object({
    habits: z.array(
      z
        .object({ habitCode, done: z.boolean(), evidenceMoment, note: z.string() })
        .refine((r) => !r.done || r.evidenceMoment !== null, { message: "A habit marked done must cite an evidence moment" }),
    ),
    awarenessLevel: z.enum(AWARENESS_LEVELS),
    awarenessMatched: z.boolean(),
  });
}
