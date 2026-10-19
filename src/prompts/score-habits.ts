import type { Prompt } from "@/lib/ai/harness";

export type ScoreHabitsVars = {
  callType: string;
  habits: { code: string; name: string; rubric: string }[];
  moments: { label: string; type: string; startS: number; endS: number; speaker: string; summary: string }[];
  transcript: string;
};

// Versioned prompt: bump `version` whenever the text changes.
export const scoreHabitsPrompt: Prompt<ScoreHabitsVars> = {
  id: "score-habits",
  version: "v1",
  system: `You score a sales call by an agency against a habits framework, and judge the client's buyer awareness.

For each habit, decide from its rubric whether the seller did it on this call.
- done: true only if the call clearly shows it. When unsure, it's not done.
- evidenceMoment: the label of the moment that best shows it. Required when done; null when not done.
- note: one short line on what you saw, or what was missing.

Buyer awareness, judged from what the client says:
- unaware: doesn't see a problem yet.
- problem_aware: knows the problem, not the kinds of solution.
- solution_aware: knows the kinds of solution, not this agency's.
- product_aware: knows what this agency offers, not yet convinced.
- most_aware: convinced, working out terms.

awarenessMatched: whether the seller's approach fits that level. For unaware or problem-aware clients, the seller should establish the problem before pitching services; for product-aware or most-aware clients, the seller should move to proof, terms and next steps rather than re-explaining the problem.`,
  user: ({ callType, habits, moments, transcript }) =>
    `Call type: ${callType}

Habits to judge:
${habits.map((h) => `- ${h.code}: ${h.name}. Rubric: ${h.rubric}`).join("\n") || "(none; judge awareness only)"}

Moments (label, type, time in seconds, speaker: summary):
${moments.map((m) => `- ${m.label} ${m.type} [${Math.floor(m.startS)}s–${Math.ceil(m.endS)}s] ${m.speaker}: ${m.summary}`).join("\n") || "(no moments)"}

Transcript (times in seconds):
${transcript}

Score each habit and judge buyer awareness.`,
};
