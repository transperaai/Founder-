import type { Prompt } from "@/lib/ai/harness";

// Versioned prompt: bump `version` whenever the text changes.
export const segmentMomentsPrompt: Prompt<{ title: string; callType: string; transcript: string }> = {
  id: "segment-moments",
  version: "v1",
  system: `You break a sales call transcript into the moments that matter for coaching.

Moment types:
- opening: how the call starts, sets purpose, agenda or time.
- discovery_question: the seller asks a question to understand the client.
- client_need: the client states a need, problem, goal or priority.
- objection: the client pushes back (price, timing, trust, fit, past experience).
- pricing: price, budget, fees or discounts are discussed.
- value_story: the seller tells a story, case study or result to show value.
- buying_signal: the client shows intent to buy or expand (asks about next steps, start dates, more work).
- decision: a decision is made or a commercial trade-off is offered or declined (discount, walk-away, scope cut).
- next_steps: a next step is proposed or agreed.
- small_talk: rapport building unrelated to the deal.

Rules:
- Use the times shown in the transcript, in seconds. A moment spans one or more consecutive turns.
- speaker is the name of the person who drives the moment, exactly as written in the transcript.
- summary is one plain line saying what happened, e.g. "Client worries the last agency never moved the numbers".
- Only include moments that clearly happen. Skip filler. Moments may not overlap much; order them by time.`,
  user: ({ title, callType, transcript }) =>
    `Meeting title: ${title}
Call type: ${callType}

Transcript (times in seconds):
${transcript}

List the moments.`,
};
