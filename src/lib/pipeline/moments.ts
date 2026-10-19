import type { CallType } from "@prisma/client";
import { dealStageFor } from "@/lib/calls/domain";
import { excerpt, type Turn } from "@/lib/calls/transcript";
import type { SegmentedMoment } from "./schemas";

/**
 * Turns the model's moments into rows: times clamped to the call, reversed
 * ranges fixed, ordered by start, with the verbatim excerpt and context attached.
 */
export function momentRows(moments: SegmentedMoment[], turns: Turn[], callType: CallType, durationS: number) {
  const end = Math.max(durationS, turns.at(-1)?.endS ?? 0);
  const clamp = (s: number) => Math.min(Math.max(0, s), end);
  return moments
    .map((m) => {
      const [startS, endS] = [clamp(m.startS), clamp(m.endS)].sort((a, b) => a - b);
      return {
        type: m.type,
        startS,
        endS,
        speaker: m.speaker.trim(),
        summary: m.summary.trim(),
        text: excerpt(turns, startS, endS),
        context: { callType, dealStage: dealStageFor[callType] },
      };
    })
    .filter((m) => m.summary !== "")
    .sort((a, b) => a.startS - b.startS);
}
