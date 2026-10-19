import "server-only";
import { z } from "zod/v4";
import { createAnthropicClient } from "./anthropic";
import { recordModelUsage } from "./usage";

// Every AI step goes through runStep: versioned prompt in, schema-validated JSON
// out, one retry on invalid output, token usage logged against the call.

export const MODEL = "claude-sonnet-5-5";

export type Prompt<Vars> = {
  /** Stable id, e.g. "business-profile". */
  id: string;
  /** Bump when the prompt text changes; recorded with every output. */
  version: string;
  system: string;
  user: (vars: Vars) => string;
};

export type LlmRequest = { model: string; system: string; user: string; jsonSchema: Record<string, unknown>; maxTokens: number };
export type LlmResponse = { text: string; model: string; stopReason: string | null; inputTokens: number; outputTokens: number };
/** The only thing that talks to the model. Tests inject a fake. */
export type LlmClient = (request: LlmRequest) => Promise<LlmResponse>;

export type AiStepErrorCode = "not_configured" | "invalid_output" | "refusal" | "api_error";

export class AiStepError extends Error {
  constructor(
    readonly code: AiStepErrorCode,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AiStepError";
  }
}

export type UsageRecorder = (usage: {
  callId?: string;
  step: string;
  model: string;
  promptVersion: string;
  inputTokens: number;
  outputTokens: number;
}) => Promise<void>;

export async function runStep<Vars, Schema extends z.ZodType>({
  step,
  prompt,
  vars,
  schema,
  callId,
  maxTokens = 16000,
  client,
  recordUsage = recordModelUsage,
}: {
  /** Pipeline step name for the usage log, e.g. "business_profile". */
  step: string;
  prompt: Prompt<Vars>;
  vars: Vars;
  schema: Schema;
  callId?: string;
  maxTokens?: number;
  client?: LlmClient;
  recordUsage?: UsageRecorder;
}): Promise<{ output: z.infer<Schema>; promptVersion: string }> {
  const llm = client ?? createAnthropicClient();
  const promptVersion = `${prompt.id}@${prompt.version}`;
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  delete jsonSchema.$schema;
  const request: LlmRequest = { model: MODEL, system: prompt.system, user: prompt.user(vars), jsonSchema, maxTokens };

  let lastProblem = "";
  for (let attempt = 1; attempt <= 2; attempt++) {
    let response: LlmResponse;
    try {
      response = await llm(request);
    } catch (error) {
      if (error instanceof AiStepError) throw error;
      throw new AiStepError("api_error", `Model request failed during ${step}`, error);
    }
    await recordUsage({
      callId,
      step,
      model: response.model,
      promptVersion,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
    });

    if (response.stopReason === "refusal") {
      throw new AiStepError("refusal", `The model declined the ${step} step`);
    }

    const parsed = parseJson(response.text);
    if (parsed.ok) {
      const result = schema.safeParse(parsed.value);
      if (result.success) return { output: result.data, promptVersion };
      lastProblem = z.prettifyError(result.error);
    } else {
      lastProblem = parsed.problem;
    }
  }
  throw new AiStepError("invalid_output", `The ${step} step returned invalid output twice: ${lastProblem}`);
}

function parseJson(text: string): { ok: true; value: unknown } | { ok: false; problem: string } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, problem: "Response was not valid JSON" };
  }
}
