import { describe, expect, it } from "vitest";
import { applicableHabits, benchmark, buildHabitResults, clientTalkShare, scoreTotal, talkRatioResult, type HabitRule } from ".";

const habit = (code: string, appliesToCallTypes: HabitRule["appliesToCallTypes"], extra: Partial<HabitRule> = {}): HabitRule => ({
  code, name: code, appliesToCallTypes, requiresObjection: false, computed: false, ...extra,
});
const habits = [
  habit("H1", ["discovery", "pitch"]),
  habit("H6", ["discovery"], { computed: true }),
  habit("H8", ["pitch"]),
  habit("H9", ["discovery", "pitch"], { requiresObjection: true }),
  habit("H10", ["discovery", "pitch"], { requiresObjection: true }),
];

describe("applicableHabits", () => {
  it("keeps habits whose 'applies to' includes the call type", () => {
    expect(applicableHabits(habits, "pitch", false).map((h) => h.code)).toEqual(["H1", "H8"]);
  });

  it("adds objection habits only when the call has an objection moment", () => {
    expect(applicableHabits(habits, "discovery", false).map((h) => h.code)).toEqual(["H1", "H6"]);
    expect(applicableHabits(habits, "discovery", true).map((h) => h.code)).toEqual(["H1", "H6", "H9", "H10"]);
  });

  it("applies nothing to a type no habit lists", () => {
    expect(applicableHabits(habits, "negotiation", true)).toEqual([]);
  });
});

describe("scoreTotal", () => {
  it("is round(done ÷ applicable × 100)", () => {
    expect(scoreTotal([{ done: true }, { done: false }, { done: false }])).toBe(33);
    expect(scoreTotal([{ done: true }, { done: true }, { done: false }])).toBe(67);
    expect(scoreTotal([{ done: true }])).toBe(100);
  });

  it("is 0 with nothing applicable", () => {
    expect(scoreTotal([])).toBe(0);
  });
});

describe("clientTalkShare (H6)", () => {
  const turn = (speaker: string, startS: number, endS: number, email?: string) => ({ speaker, startS, endS, text: "…", email });

  it("counts speakers off the founder's domain as the client", () => {
    const turns = [turn("Peter", 0, 30, "peter@brightside.agency"), turn("Dana", 30, 100, "dana@northwind.com")];
    expect(clientTalkShare(turns, "brightside.agency", null)).toBeCloseTo(0.7);
  });

  it("without emails, treats everyone but the call owner as the client", () => {
    const turns = [turn("Sam", 0, 60), turn("Dana", 60, 100), turn("Lee", 100, 120)];
    expect(clientTalkShare(turns, "brightside.agency", "Sam")).toBeCloseTo(0.5);
  });

  it("recognises the owner by their email elsewhere in the call", () => {
    const turns = [turn("Sam", 0, 10, "sam@brightside.agency"), turn("Sam", 10, 50), turn("Dana", 50, 100)];
    expect(clientTalkShare(turns, "brightside.agency", "Someone else")).toBeCloseTo(0.5);
  });

  it("is done only above half", () => {
    expect(talkRatioResult("H6", 0.5)).toEqual({ habitCode: "H6", done: false, evidenceMomentId: null, note: "Client talked 50% of the time" });
    expect(talkRatioResult("H6", 0.51).done).toBe(true);
  });
});

describe("buildHabitResults", () => {
  it("returns one result per applicable habit; skipped or unevidenced habits are not observed", () => {
    const applicable = applicableHabits(habits, "discovery", true);
    const results = buildHabitResults(
      applicable,
      [
        { habitCode: "H1", done: true, evidenceMomentId: "m1", note: "States agenda" },
        { habitCode: "H9", done: true, evidenceMomentId: null, note: "?" },
        { habitCode: "H8", done: true, evidenceMomentId: "m2", note: "not applicable" },
      ],
      (h) => talkRatioResult(h.code, 0.6),
    );
    expect(results).toEqual([
      { habitCode: "H1", done: true, evidenceMomentId: "m1", note: "States agenda" },
      { habitCode: "H6", done: true, evidenceMomentId: null, note: "Client talked 60% of the time" },
      { habitCode: "H9", done: false, evidenceMomentId: null, note: "not_observed" },
      { habitCode: "H10", done: false, evidenceMomentId: null, note: "not_observed" },
    ]);
  });
});

it("benchmark averages founder scores", () => {
  expect(benchmark([80, 91])).toBe(86);
  expect(benchmark([])).toBeNull();
});
