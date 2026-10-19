import type { CallType } from "@prisma/client";

export const RECOMMENDED_CALLS = { min: 10, max: 20 };
/** A call type with fewer founder calls than this is a thin area. */
export const THIN_THRESHOLD = 3;
export const COVERED_TYPES: Exclude<CallType, "internal">[] = ["discovery", "pitch", "account_review", "negotiation"];

export type Coverage = {
  total: number;
  byType: { type: Exclude<CallType, "internal">; count: number; thin: boolean }[];
};

/** Coverage of founder calls (internal calls excluded) against the recommendation. */
export function coverage(calls: { callType: CallType | null }[]): Coverage {
  const external = calls.filter((c) => c.callType !== "internal");
  return {
    total: external.length,
    byType: COVERED_TYPES.map((type) => {
      const count = external.filter((c) => c.callType === type).length;
      return { type, count, thin: count < THIN_THRESHOLD };
    }),
  };
}

export const callTypeLabel: Record<CallType, string> = {
  discovery: "Discovery",
  pitch: "Pitch",
  account_review: "Account review",
  negotiation: "Negotiation",
  internal: "Internal",
};
