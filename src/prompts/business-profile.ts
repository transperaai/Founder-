import type { Prompt } from "@/lib/ai/harness";
import { QUESTIONS, type BusinessAnswers } from "@/lib/business-context";

// Versioned prompt: bump `version` whenever the text changes.
export const businessProfilePrompt: Prompt<{ answers: BusinessAnswers }> = {
  id: "business-profile",
  version: "v1",
  system: `You turn an agency founder's answers about their business into a short profile card.
The card is read by sales reps and used as context when analysing sales calls.

Write in plain, specific language, using the founder's own words and numbers where they gave them.
Each field is one or two sentences. Don't invent facts the founder didn't state; if an answer is thin, keep the field short.`,
  user: ({ answers }) =>
    `Here are the founder's answers.\n\n${QUESTIONS.map((q) => `${q.label}\n${answers[q.id]?.trim() || "(no answer)"}`).join("\n\n")}

Write the profile card: ideal clients, offer, differentiators, sales process and common objections.`,
};
