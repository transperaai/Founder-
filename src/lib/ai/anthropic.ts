import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { AiStepError, type LlmClient } from "./harness";

/** The real model client: structured JSON output, with server-side fallback on refusals. */
export function createAnthropicClient(): LlmClient {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AiStepError("not_configured", "ANTHROPIC_API_KEY is not set, so AI steps can't run.");
  }
  const anthropic = new Anthropic();
  return async ({ model, system, user, jsonSchema, maxTokens }) => {
    const message = await anthropic.beta.messages.create({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
      output_config: { format: { type: "json_schema", schema: jsonSchema } },
      // If a safety classifier declines, the API retries on a fallback model in the same call.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });
    const text = message.content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("");
    return {
      text,
      model: message.model,
      stopReason: message.stop_reason,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    };
  };
}
