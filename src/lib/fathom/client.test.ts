import { afterEach, describe, expect, it } from "vitest";
import { createFakeFathom, VALID_KEY, type FakeFathomOptions } from "../../../tests/fake-fathom/server";
import { createFathomClient, FathomError } from "./client";

let stop: (() => Promise<void>) | undefined;
afterEach(async () => {
  await stop?.();
  stop = undefined;
});

async function setup(apiKey = VALID_KEY, options?: FakeFathomOptions) {
  const fake = createFakeFathom(options);
  const baseUrl = await fake.start();
  stop = fake.stop;
  return { fake, client: createFathomClient({ apiKey, baseUrl }) };
}

describe("Fathom client", () => {
  it("lists meetings page by page with the cursor, sending the key as X-Api-Key", async () => {
    const { fake, client } = await setup();
    const first = await client.listMeetings();
    expect(first.meetings.map((m) => m.recording_id)).toEqual([9001, 9002]);
    expect(first.nextCursor).toBe("page-2");

    const second = await client.listMeetings({ cursor: first.nextCursor! });
    expect(second.meetings.map((m) => m.recording_id)).toEqual([9003]);
    expect(second.nextCursor).toBeNull();

    expect(fake.requests.map((r) => [r.path, r.query.cursor, r.apiKey])).toEqual([
      ["/meetings", undefined, VALID_KEY],
      ["/meetings", "page-2", VALID_KEY],
    ]);
  });

  it("fetches a recording's transcript", async () => {
    const { client } = await setup();
    const transcript = await client.getTranscript("9001");
    expect(transcript[0]).toEqual({
      speaker: { display_name: "Peter Hale", matched_calendar_invitee_email: "peter@brightside.agency" },
      text: "Thanks for making time, Dana. I've got us down for 30 minutes.",
      timestamp: "00:00:02",
    });
  });

  it.each([
    ["a bad key", "wrong-key", undefined, "unauthorized"],
    ["a rate limit", VALID_KEY, { failures: [{ path: "/meetings", status: 429, times: 1, retryAfter: 17 }] }, "rate_limited"],
    ["a server error", VALID_KEY, { failures: [{ path: "/meetings", status: 503, times: 1 }] }, "unavailable"],
    ["a bad request", VALID_KEY, { failures: [{ path: "/meetings", status: 400, times: 1 }] }, "bad_request"],
  ] as const)("maps %s to a typed error", async (_label, key, options, code) => {
    const { client } = await setup(key, options as FakeFathomOptions | undefined);
    const error = await client.listMeetings().catch((e) => e);
    expect(error).toBeInstanceOf(FathomError);
    expect(error.code).toBe(code);
    if (code === "rate_limited") expect(error.retryAfterS).toBe(17);
  });

  it("maps a missing recording to not_found", async () => {
    const { client } = await setup();
    expect((await client.getTranscript(1).catch((e) => e)).code).toBe("not_found");
  });

  it("treats an unreachable server as unavailable", async () => {
    const client = createFathomClient({ apiKey: VALID_KEY, baseUrl: "http://127.0.0.1:9/external/v1" });
    expect((await client.listMeetings().catch((e) => e)).code).toBe("unavailable");
  });

  it("rejects a response that doesn't match the documented shape", async () => {
    const client = createFathomClient({ apiKey: VALID_KEY, baseUrl: "http://x", fetch: async () => Response.json({ nope: true }) });
    expect((await client.listMeetings().catch((e) => e)).code).toBe("invalid_response");
  });
});
