import type { Prompt } from "@/lib/ai/harness";

// Versioned prompt: bump `version` whenever the text changes.
export const classifyCallPrompt: Prompt<{ title: string; opening: string; businessSummary: string | null }> = {
  id: "classify-call",
  version: "v1",
  system: `You classify sales calls for a digital agency.

Call types:
- discovery: an early call to understand a prospect's situation, needs and goals before any proposal.
- pitch: presenting the agency, a proposal, approach or creative to a prospect.
- account_review: a call with an existing client about results, the account or further work.
- negotiation: agreeing price, scope, contract terms or a discount to close a deal.

You only see the opening of the call. Pick the single best-fitting type and give a one-sentence reason.`,
  user: ({ title, opening, businessSummary }) =>
    `${businessSummary ? `About the agency:\n${businessSummary}\n\n` : ""}Meeting title: ${title}

The first 10 minutes of the transcript (times in seconds):
${opening || "(no transcript in the first 10 minutes)"}

Classify the call.`,
};
