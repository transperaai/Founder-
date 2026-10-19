import { describe, expect, it } from "vitest";
import { excerpt, firstSeconds, formatTurns, normaliseTurns } from "./transcript";

const turn = (speaker: string, startS: number, endS: number | undefined, text: string) => ({ speaker, startS, endS, text });

describe("normaliseTurns", () => {
  it("is a no-op on an already-normalised transcript", () => {
    const turns = [
      { speaker: "Peter", email: "peter@a.com", startS: 0, endS: 5, text: "Hi" },
      { speaker: "Dana", startS: 6, endS: 9, text: "Hello" },
    ];
    expect(normaliseTurns(turns)).toEqual({ turns, changed: false });
  });

  it("orders turns, fills missing or impossible end times and drops empty turns", () => {
    const { turns, changed } = normaliseTurns([
      turn("Dana", 10, undefined, "Sure, go ahead."),
      turn("Peter", 0, 3, " Shall we start? "),
      turn("Peter", 4, 2, "One more thing"),
      turn("Peter", 20, undefined, "   "),
      turn("Dana", 30, undefined, "one two three four five six seven eight nine ten"),
    ]);
    expect(changed).toBe(true);
    expect(turns).toEqual([
      { speaker: "Peter", startS: 0, endS: 3, text: "Shall we start?" },
      { speaker: "Peter", startS: 4, endS: 10, text: "One more thing" },
      { speaker: "Dana", startS: 10, endS: 30, text: "Sure, go ahead." },
      { speaker: "Dana", startS: 30, endS: 34, text: "one two three four five six seven eight nine ten" },
    ]);
  });

  it("lower-cases emails and names unnamed speakers", () => {
    const { turns } = normaliseTurns([{ speaker: " ", email: "Dana@Northwind.com", startS: 0, endS: 1, text: "Hi" }]);
    expect(turns[0]).toMatchObject({ speaker: "Unknown speaker", email: "dana@northwind.com" });
  });

  it("rejects anything that isn't a list of turns", () => {
    expect(() => normaliseTurns({ text: "hello" })).toThrow();
    expect(() => normaliseTurns([{ speaker: "x" }])).toThrow();
  });
});

describe("transcript helpers", () => {
  const turns = [
    { speaker: "Peter", startS: 0, endS: 300, text: "Opening" },
    { speaker: "Dana", startS: 301, endS: 700, text: "Middle" },
    { speaker: "Peter", startS: 701, endS: 702.4, text: "Late" },
  ];

  it("keeps turns that start in the first N seconds", () => {
    expect(firstSeconds(turns, 600).map((t) => t.text)).toEqual(["Opening", "Middle"]);
  });

  it("excerpts the turns overlapping a range", () => {
    expect(excerpt(turns, 250, 350)).toBe("Peter: Opening\nDana: Middle");
  });

  it("formats turns with whole-second times", () => {
    expect(formatTurns(turns.slice(2))).toBe("[701s–703s] Peter: Late");
  });
});
