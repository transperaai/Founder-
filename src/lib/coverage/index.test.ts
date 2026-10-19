import { describe, expect, it } from "vitest";
import { coverage } from ".";

describe("coverage", () => {
  it("counts external founder calls per type and flags thin areas", () => {
    const result = coverage([
      { callType: "discovery" }, { callType: "discovery" }, { callType: "discovery" },
      { callType: "pitch" }, { callType: "internal" }, { callType: null },
    ]);
    expect(result.total).toBe(5);
    expect(result.byType).toEqual([
      { type: "discovery", count: 3, thin: false },
      { type: "pitch", count: 1, thin: true },
      { type: "account_review", count: 0, thin: true },
      { type: "negotiation", count: 0, thin: true },
    ]);
  });
});
