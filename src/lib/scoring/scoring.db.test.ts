import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { analyseCall } from "@/lib/pipeline";
import { classifyCallPrompt } from "@/prompts/classify-call";
import { scoreHabitsPrompt } from "@/prompts/score-habits";
import { segmentMomentsPrompt } from "@/prompts/segment-moments";
import { createCall, createFounder, createHabits, fixtures } from "../../../tests/fixtures/calls";
import { fakeClaude } from "../../../tests/fixtures/fake-claude";
import { founderAverages } from "./benchmarks";

// Moments m1–m5 in time order: opening, client_need, objection, value_story, next_steps.
const segmentation = {
  moments: [
    { type: "opening", startS: 0, endS: 14, speaker: "Peter Hale", summary: "Sets a 30-minute agenda" },
    { type: "client_need", startS: 15, endS: 30, speaker: "Dana Price", summary: "Sales flat before Q3" },
    { type: "objection", startS: 41, endS: 62, speaker: "Dana Price", summary: "Last agency was expensive" },
    { type: "value_story", startS: 63, endS: 95, speaker: "Peter Hale", summary: "Harbour Health grew 22%" },
    { type: "next_steps", startS: 121, endS: 150, speaker: "Peter Hale", summary: "Books a workshop for Tuesday" },
  ],
};

const scoring = (done: Record<string, string>) => ({
  habits: ["H1", "H2", "H3", "H4", "H5", "H7", "H9", "H10", "H11", "H12", "H14"].map((code) =>
    done[code] ? { habitCode: code, done: true, evidenceMoment: done[code], note: `Saw ${code}` } : { habitCode: code, done: false, evidenceMoment: null, note: "Didn't happen" },
  ),
  awarenessLevel: "problem_aware",
  awarenessMatched: true,
});

const model = (score: unknown) =>
  fakeClaude([
    [classifyCallPrompt, { callType: "discovery", reason: "intro" }],
    [segmentMomentsPrompt, segmentation],
    [scoreHabitsPrompt, score],
  ]);

async function setup() {
  await createFounder();
  await createHabits();
}

describe("scoring step", () => {
  it("scores every applicable habit, computes H6 from talk time and stores the total", async () => {
    await setup();
    const call = await createCall(fixtures.discovery, "founder");
    const { client, requests } = model(scoring({ H1: "m1", H3: "m2", H9: "m3", H11: "m5" }));

    await analyseCall(call.id, { client });

    const scorecard = await db.scorecard.findUniqueOrThrow({ where: { callId: call.id } });
    const moments = await db.moment.findMany({ where: { callId: call.id }, orderBy: { startS: "asc" } });
    const results = scorecard.habitResults as { habitCode: string; done: boolean; evidenceMomentId: string | null; note: string }[];

    // A discovery call with an objection: 12 applicable habits (H8 and H13 don't apply).
    expect(results.map((r) => r.habitCode).sort()).toEqual(["H1", "H10", "H11", "H12", "H14", "H2", "H3", "H4", "H5", "H6", "H7", "H9"]);
    expect(results.find((r) => r.habitCode === "H1")).toEqual({ habitCode: "H1", done: true, evidenceMomentId: moments[0].id, note: "Saw H1" });
    expect(results.find((r) => r.habitCode === "H9")?.evidenceMomentId).toBe(moments[2].id);
    expect(results.find((r) => r.habitCode === "H2")).toEqual({ habitCode: "H2", done: false, evidenceMomentId: null, note: "Didn't happen" });
    // Dana talks 91s of 175s.
    expect(results.find((r) => r.habitCode === "H6")).toEqual({ habitCode: "H6", done: true, evidenceMomentId: null, note: "Client talked 52% of the time" });
    expect(results.filter((r) => r.done).every((r) => r.habitCode === "H6" || r.evidenceMomentId)).toBe(true);

    expect(scorecard).toMatchObject({ callType: "discovery", total: 42, awarenessLevel: "problem_aware", awarenessMatched: true, benchmarkTotal: 42 });
    expect(scorecard.promptVersion).toBe("score-habits@v1");

    // The model is only asked about habits it judges: not H6 (computed) and not habits that don't apply.
    const scoringRequest = requests.find((r) => r.system === scoreHabitsPrompt.system)!;
    expect(scoringRequest.user).toContain("- H1:");
    expect(scoringRequest.user).not.toContain("- H6:");
    expect(scoringRequest.user).not.toContain("- H13:");
    expect(scoringRequest.user).toContain("- m3 objection [41s–62s] Dana Price: Last agency was expensive");
  });

  it("rejects a habit marked done without evidence, and fails after the retry", async () => {
    await setup();
    const call = await createCall(fixtures.discovery);
    const bad = scoring({});
    bad.habits[0] = { habitCode: "H1", done: true, evidenceMoment: null, note: "Trust me" };
    const { client, requests } = model(bad);

    const error = await analyseCall(call.id, { client }).catch((e) => e);
    expect(error.code).toBe("invalid_output");
    expect(error.message).toContain("must cite an evidence moment");
    expect(requests.filter((r) => r.system === scoreHabitsPrompt.system)).toHaveLength(2);
    expect(await db.scorecard.count()).toBe(0);
  });

  it("re-scoring replaces the scorecard", async () => {
    await setup();
    const call = await createCall(fixtures.discovery);
    await analyseCall(call.id, { client: model(scoring({ H1: "m1" })).client });
    await analyseCall(call.id, { client: model(scoring({ H1: "m1", H2: "m1", H3: "m2" })).client });

    const scorecards = await db.scorecard.findMany();
    expect(scorecards).toHaveLength(1);
    expect(scorecards[0].total).toBe(33);
  });

  it("founder calls form the per-type benchmark that rep scorecards store", async () => {
    await setup();
    const founderCall = await createCall(fixtures.discovery, "founder");
    await analyseCall(founderCall.id, { client: model(scoring({ H1: "m1", H3: "m2", H9: "m3", H11: "m5" })).client });
    const founderCall2 = await createCall({ ...fixtures.discovery, title: "Second intro" }, "founder");
    await analyseCall(founderCall2.id, { client: model(scoring({ H1: "m1" })).client });
    const repCall = await createCall({ ...fixtures.discovery, title: "Rep intro" }, "rep");
    await analyseCall(repCall.id, { client: model(scoring({})).client });

    // Founder scores 42 and 17 (H1 + H6 of 12): average 29.5 rounds to 30.
    expect(await founderAverages()).toEqual([{ callType: "discovery", average: 30, calls: 2 }]);
    expect(await db.scorecard.findUniqueOrThrow({ where: { callId: repCall.id } })).toMatchObject({ total: 8, benchmarkTotal: 30 });
  });

  it("a call overridden to internal loses its scorecard", async () => {
    await setup();
    const call = await createCall(fixtures.discovery);
    await analyseCall(call.id, { client: model(scoring({})).client });
    await db.call.update({ where: { id: call.id }, data: { callType: "internal", callTypeOverridden: true } });
    await analyseCall(call.id, { client: model(scoring({})).client });
    expect(await db.scorecard.count()).toBe(0);
  });
});
