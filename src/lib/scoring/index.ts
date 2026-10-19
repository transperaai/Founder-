import type { CallType } from "@prisma/client";
import { emailDomain } from "@/lib/calls/domain";
import type { Turn } from "@/lib/calls/transcript";

// Scoring rules from the spec (#1, Scoring). Pure: habits come from the
// database, so swapping the framework needs only new seed data.

export type HabitRule = {
  code: string;
  name: string;
  appliesToCallTypes: CallType[];
  requiresObjection: boolean;
  computed: boolean;
};

export type HabitResult = { habitCode: string; done: boolean; evidenceMomentId: string | null; note: string };

/** Habits that apply to a call: its type is in "applies to", and objection habits only when there's an objection moment. */
export function applicableHabits<H extends HabitRule>(habits: H[], callType: CallType, hasObjection: boolean): H[] {
  return habits.filter((h) => h.appliesToCallTypes.includes(callType) && (!h.requiresObjection || hasObjection));
}

/** score = round(done ÷ applicable × 100). A call with no applicable habits scores 0. */
export function scoreTotal(results: { done: boolean }[]) {
  if (results.length === 0) return 0;
  return Math.round((results.filter((r) => r.done).length / results.length) * 100);
}

/**
 * Share of talk time that is the client's, from speaker-turn durations.
 * A speaker with an email is the client when their domain isn't the founder's.
 * Without an email, everyone but the call owner is the client; the owner is
 * whoever speaks from the founder's domain elsewhere in the call, else `ownerName`.
 */
export function clientTalkShare(turns: Turn[], founderDomain: string | null, ownerName: string | null) {
  const ours = new Set(turns.filter((t) => t.email && emailDomain(t.email) === founderDomain).map((t) => t.speaker));
  if (ours.size === 0 && ownerName) ours.add(ownerName);
  const isClient = (t: Turn) => (t.email ? emailDomain(t.email) !== founderDomain : !ours.has(t.speaker));

  let client = 0;
  let total = 0;
  for (const t of turns) {
    const duration = Math.max(0, t.endS - t.startS);
    total += duration;
    if (isClient(t)) client += duration;
  }
  return total === 0 ? 0 : client / total;
}

/** H6-style computed result: done when the client talks more than half the time. */
export function talkRatioResult(habitCode: string, share: number): HabitResult {
  return { habitCode, done: share > 0.5, evidenceMomentId: null, note: `Client talked ${Math.round(share * 100)}% of the time` };
}

/**
 * One result per applicable habit, in framework order. Model results for
 * habits that don't apply are dropped; a habit the model skipped, or marked
 * done without evidence, counts as not observed.
 */
export function buildHabitResults(
  applicable: HabitRule[],
  judged: HabitResult[],
  computed: (habit: HabitRule) => HabitResult,
): HabitResult[] {
  return applicable.map((habit) => {
    if (habit.computed) return computed(habit);
    const result = judged.find((r) => r.habitCode === habit.code);
    if (!result || !result.done || !result.evidenceMomentId) {
      return { habitCode: habit.code, done: false, evidenceMomentId: null, note: result && !result.done && result.note ? result.note : "not_observed" };
    }
    return result;
  });
}

/** Average of founder scores for a call type, or null without any. */
export function benchmark(scores: number[]) {
  return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
}
