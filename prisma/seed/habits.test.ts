import { describe, expect, it } from "vitest";
import { accountManagerPath, habits, skills } from "./habits";

describe("habit seed data", () => {
  it("defines H1–H14 once each, all in the account manager path", () => {
    const codes = habits.map((h) => h.code);
    expect(codes).toEqual(Array.from({ length: 14 }, (_, i) => `H${i + 1}`));
    expect([...accountManagerPath].sort()).toEqual([...codes].sort());
  });

  it("only references known skills", () => {
    expect(habits.every((h) => skills.includes(h.skill))).toBe(true);
  });

  it("marks H6 as computed and H9/H10 as objection-only", () => {
    expect(habits.filter((h) => h.computed).map((h) => h.code)).toEqual(["H6"]);
    expect(habits.filter((h) => h.requiresObjection).map((h) => h.code)).toEqual(["H9", "H10"]);
  });
});
