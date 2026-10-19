import { describe, expect, it } from "vitest";
import { momentRows } from "./moments";

const turns = [
  { speaker: "Peter", startS: 0, endS: 10, text: "Hello" },
  { speaker: "Dana", startS: 11, endS: 20, text: "Too expensive" },
];

describe("momentRows", () => {
  it("clamps times to the call, fixes reversed ranges, orders by start and attaches the excerpt", () => {
    const rows = momentRows(
      [
        { type: "objection", startS: 25, endS: 11, speaker: " Dana ", summary: "Price pushback" },
        { type: "opening", startS: -3, endS: 10, speaker: "Peter", summary: "Opens" },
        { type: "small_talk", startS: 1, endS: 2, speaker: "Peter", summary: "  " },
      ],
      turns,
      "pitch",
      20,
    );
    expect(rows).toEqual([
      { type: "opening", startS: 0, endS: 10, speaker: "Peter", summary: "Opens", text: "Peter: Hello", context: { callType: "pitch", dealStage: "proposal" } },
      { type: "objection", startS: 11, endS: 20, speaker: "Dana", summary: "Price pushback", text: "Dana: Too expensive", context: { callType: "pitch", dealStage: "proposal" } },
    ]);
  });
});
