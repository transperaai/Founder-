import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { classifyCallPrompt } from "@/prompts/classify-call";
import { segmentMomentsPrompt } from "@/prompts/segment-moments";
import { createCall, createFounder, fixtures } from "../../../tests/fixtures/calls";
import { fakeClaude } from "../../../tests/fixtures/fake-claude";
import { analyseCall, analyseCallNow } from ".";

const segmentation = {
  moments: [
    { type: "opening", startS: 0, endS: 14, speaker: "Peter Hale", summary: "Sets a 30-minute agenda" },
    { type: "client_need", startS: 15, endS: 30, speaker: "Dana Price", summary: "Sales flat; board wants a plan before Q3" },
    { type: "objection", startS: 41, endS: 62, speaker: "Dana Price", summary: "Last agency was expensive and didn't move the numbers" },
    // Out of order, reversed and beyond the call's end: the pipeline tidies these up.
    { type: "next_steps", startS: 400, endS: 121, speaker: "Peter Hale", summary: "Books a workshop for Tuesday" },
    { type: "value_story", startS: 63, endS: 95, speaker: "Peter Hale", summary: "Harbour Health grew 22% with a fee tied to repeat orders" },
  ],
};

const fakeModel = () =>
  fakeClaude([
    [classifyCallPrompt, { callType: "discovery", reason: "An intro call exploring the client's situation" }],
    [segmentMomentsPrompt, segmentation],
  ]);

describe("analyseCall", () => {
  it("classifies an external call and stores its moments with timestamps and summaries", async () => {
    await createFounder();
    const call = await createCall(fixtures.discovery);
    const { client, requests } = fakeModel();

    expect(await analyseCall(call.id, { client })).toBe("ready");

    const stored = await db.call.findUniqueOrThrow({ where: { id: call.id }, include: { moments: { orderBy: { startS: "asc" } } } });
    expect(stored.status).toBe("ready");
    expect(stored.callType).toBe("discovery");
    expect(stored.moments.map((m) => [m.type, m.startS, m.endS])).toEqual([
      ["opening", 0, 14],
      ["client_need", 15, 30],
      ["objection", 41, 62],
      ["value_story", 63, 95],
      ["next_steps", 121, 182],
    ]);
    const objection = stored.moments.find((m) => m.type === "objection")!;
    expect(objection.summary).toBe("Last agency was expensive and didn't move the numbers");
    expect(objection.speaker).toBe("Dana Price");
    expect(objection.text).toContain("we never saw the numbers move");
    expect(objection.context).toEqual({ callType: "discovery", dealStage: "early" });

    // Classification only sees the opening; segmentation sees the whole call.
    expect(requests).toHaveLength(2);
    expect(requests[0].user).toContain("[0s–14s] Peter Hale: Thanks for making time");
    expect(requests[1].user).toContain("Call type: discovery");
    const usage = await db.modelUsage.findMany({ where: { callId: call.id } });
    expect(usage.map((u) => u.step).sort()).toEqual(["classify_call", "segment_moments"]);
    expect(usage[0].promptVersion).toMatch(/@v1$/);
  });

  it("marks an all-same-domain call internal and skips it without calling the model", async () => {
    await createFounder();
    const call = await createCall(fixtures.internal);
    const { client, requests } = fakeModel();

    expect(await analyseCall(call.id, { client })).toBe("skipped");

    const stored = await db.call.findUniqueOrThrow({ where: { id: call.id } });
    expect(stored.callType).toBe("internal");
    expect(stored.status).toBe("skipped");
    expect(requests).toHaveLength(0);
    expect(await db.moment.count()).toBe(0);
  });

  it("replaces moments when re-run instead of duplicating them", async () => {
    await createFounder();
    const call = await createCall(fixtures.discovery);
    await analyseCall(call.id, { client: fakeModel().client });
    const first = await db.moment.findMany({ where: { callId: call.id } });

    await analyseCall(call.id, { client: fakeModel().client });
    const second = await db.moment.findMany({ where: { callId: call.id } });

    expect(second).toHaveLength(first.length);
    expect(second.map((m) => m.id)).not.toContain(first[0].id);
  });

  it("keeps the founder's type override and re-segments without classifying", async () => {
    await createFounder();
    const call = await createCall(fixtures.discovery);
    await db.call.update({ where: { id: call.id }, data: { callType: "pitch", callTypeOverridden: true } });
    const { client, requests } = fakeModel();

    await analyseCall(call.id, { client });

    expect((await db.call.findUniqueOrThrow({ where: { id: call.id } })).callType).toBe("pitch");
    expect(requests).toHaveLength(1);
    expect(requests[0].system).toBe(segmentMomentsPrompt.system);
    expect((await db.moment.findFirstOrThrow({ where: { callId: call.id } })).context).toMatchObject({ callType: "pitch" });
  });

  it("an override to internal skips the call and clears its moments", async () => {
    await createFounder();
    const call = await createCall(fixtures.discovery);
    await analyseCall(call.id, { client: fakeModel().client });
    await db.call.update({ where: { id: call.id }, data: { callType: "internal", callTypeOverridden: true } });

    expect(await analyseCall(call.id, { client: fakeModel().client })).toBe("skipped");
    expect(await db.moment.count({ where: { callId: call.id } })).toBe(0);
  });

  it("normalises turns missing end times before analysis", async () => {
    await createFounder();
    const transcript = fixtures.discovery.transcript.map((t, i) => (i === 1 ? { ...t, endS: undefined } : t));
    const call = await createCall({ ...fixtures.discovery, transcript });
    await analyseCall(call.id, { client: fakeModel().client });

    const stored = await db.call.findUniqueOrThrow({ where: { id: call.id } });
    expect((stored.transcript as { endS: number }[])[1].endS).toBe(31);
  });

  it("records a failure as an error with a readable message, and a retry succeeds", async () => {
    await createFounder();
    const call = await createCall(fixtures.discovery);
    const broken = fakeClaude([
      [classifyCallPrompt, { callType: "discovery", reason: "x" }],
      [segmentMomentsPrompt, "not json"],
    ]);

    expect(await analyseCallNow(call.id, { client: broken.client })).toBe("error");
    const failed = await db.call.findUniqueOrThrow({ where: { id: call.id } });
    expect(failed.status).toBe("error");
    expect(failed.errorMessage).toMatch(/couldn't read/);
    expect(await db.moment.count()).toBe(0);

    expect(await analyseCallNow(call.id, { client: fakeModel().client })).toBe("ready");
    const retried = await db.call.findUniqueOrThrow({ where: { id: call.id } });
    expect(retried.status).toBe("ready");
    expect(retried.errorMessage).toBeNull();
  });

  it("runs each stage through the step runner it's given", async () => {
    await createFounder();
    const call = await createCall(fixtures.discovery);
    const names: string[] = [];
    await analyseCall(call.id, { client: fakeModel().client, run: (name, fn) => (names.push(name), fn()) });
    expect(names).toEqual(["start", "normalise", "classify", "segment", "finish"]);
  });
});
