import "server-only";
import type { CallType } from "@prisma/client";
import { db } from "@/lib/db";

/** The founder's average score per call type: the benchmark reps are compared with. */
export async function founderAverages(): Promise<{ callType: CallType; average: number; calls: number }[]> {
  const groups = await db.scorecard.groupBy({
    by: ["callType"],
    where: { call: { role: "founder" } },
    _avg: { total: true },
    _count: true,
    orderBy: { callType: "asc" },
  });
  return groups.map((g) => ({ callType: g.callType, average: Math.round(g._avg.total ?? 0), calls: g._count }));
}

/** The founder's average for one call type, or null before any founder call of that type is scored. */
export async function founderAverage(callType: CallType) {
  return (await founderAverages()).find((a) => a.callType === callType)?.average ?? null;
}
