import { describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";

vi.mock("server-only", () => ({}));
vi.mock("./usage", () => ({ recordModelUsage: vi.fn() }));
vi.mock("./anthropic", () => ({ createAnthropicClient: vi.fn() }));

const { AiStepError, runStep } = await import("./harness");
type LlmClient = import("./harness").LlmClient;

const prompt = { id: "test", version: "v3", system: "sys", user: (v: { name: string }) => `Hello ${v.name}` };
const schema = z.object({ greeting: z.string() });
const reply = (text: string, stopReason = "end_turn") => ({ text, model: "claude-sonnet-5-5", stopReason, inputTokens: 10, outputTokens: 5 });

describe("runStep", () => {
  it("renders the prompt, sends a JSON schema and returns validated output", async () => {
    const client = vi.fn<LlmClient>().mockResolvedValue(reply('{"greeting":"hi"}'));
    const recordUsage = vi.fn();
    const result = await runStep({ step: "greet", prompt, vars: { name: "Peter" }, schema, client, recordUsage, callId: "c1" });

    expect(result).toEqual({ output: { greeting: "hi" }, promptVersion: "test@v3" });
    const request = client.mock.calls[0][0];
    expect(request.user).toBe("Hello Peter");
    expect(request.model).toBe("claude-sonnet-5-5");
    expect(request.jsonSchema).toMatchObject({ type: "object", required: ["greeting"], additionalProperties: false });
    expect(request.jsonSchema).not.toHaveProperty("$schema");
    expect(recordUsage).toHaveBeenCalledWith({
      callId: "c1", step: "greet", model: "claude-sonnet-5-5", promptVersion: "test@v3", inputTokens: 10, outputTokens: 5,
    });
  });

  it("retries once on invalid JSON and logs tokens for both attempts", async () => {
    const client = vi.fn<LlmClient>().mockResolvedValueOnce(reply("not json")).mockResolvedValueOnce(reply('{"greeting":"ok"}'));
    const recordUsage = vi.fn();
    const result = await runStep({ step: "greet", prompt, vars: { name: "x" }, schema, client, recordUsage });
    expect(result.output.greeting).toBe("ok");
    expect(client).toHaveBeenCalledTimes(2);
    expect(recordUsage).toHaveBeenCalledTimes(2);
  });

  it("throws a typed error after two invalid outputs", async () => {
    const client = vi.fn<LlmClient>().mockResolvedValue(reply('{"wrong":1}'));
    const error = await runStep({ step: "greet", prompt, vars: { name: "x" }, schema, client, recordUsage: vi.fn() }).catch((e) => e);
    expect(error).toBeInstanceOf(AiStepError);
    expect(error.code).toBe("invalid_output");
    expect(client).toHaveBeenCalledTimes(2);
  });

  it("surfaces refusals without retrying", async () => {
    const client = vi.fn<LlmClient>().mockResolvedValue(reply("", "refusal"));
    const error = await runStep({ step: "greet", prompt, vars: { name: "x" }, schema, client, recordUsage: vi.fn() }).catch((e) => e);
    expect(error.code).toBe("refusal");
    expect(client).toHaveBeenCalledTimes(1);
  });

  it("wraps transport failures as api_error", async () => {
    const client = vi.fn<LlmClient>().mockRejectedValue(new Error("socket hang up"));
    const error = await runStep({ step: "greet", prompt, vars: { name: "x" }, schema, client, recordUsage: vi.fn() }).catch((e) => e);
    expect(error.code).toBe("api_error");
  });
});
