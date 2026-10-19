import type { LlmClient, LlmRequest } from "@/lib/ai/harness";
import type { Prompt } from "@/lib/ai/harness";

type Canned = unknown | ((request: LlmRequest) => unknown);

/**
 * A fake model client: answers each prompt (matched by its system text) with
 * canned JSON, and records every request. Never calls the real API.
 */
export function fakeClaude(responses: [Prompt<never>, Canned][]) {
  const requests: LlmRequest[] = [];
  const client: LlmClient = async (request) => {
    requests.push(request);
    const match = responses.find(([prompt]) => prompt.system === request.system);
    if (!match) throw new Error(`fakeClaude has no response for this prompt: ${request.system.slice(0, 60)}`);
    const body = typeof match[1] === "function" ? (match[1] as (r: LlmRequest) => unknown)(request) : match[1];
    return { text: typeof body === "string" ? body : JSON.stringify(body), model: "fake", stopReason: "end_turn", inputTokens: 100, outputTokens: 50 };
  };
  return { client, requests };
}
