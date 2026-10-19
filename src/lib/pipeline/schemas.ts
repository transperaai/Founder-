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
