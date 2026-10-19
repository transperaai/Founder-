import { describe, expect, it } from "vitest";
import fixtures from "../../../tests/fake-fathom/fixtures.json";
import type { FathomMeeting, FathomTranscriptItem } from "./client";
import { callFromSummary, fathomTurns, meetingSummary, timestampSeconds } from "./mapping";

const northwind = fixtures.pages[0].items[0] as FathomMeeting;

describe("meetingSummary", () => {
  it("takes title, start, duration and every attendee email from a meeting", () => {
    expect(meetingSummary(northwind)).toEqual({
      recordingId: "9001",
      title: "Northwind Retail <> Brightside",
      startedAt: "2026-10-14T09:00:00.000Z",
      durationS: 31 * 60,
      attendeeEmails: ["peter@brightside.agency", "dana@northwind.com", "lee@northwind.com"],
    });
  });

  it("derives the client domain when stored as a call", () => {
    expect(callFromSummary(meetingSummary(northwind), "brightside.agency")).toMatchObject({
      fathomRecordingId: "9001",
      clientDomain: "northwind.com",
      status: "importing",
      transcript: [],
    });
  });
});

describe("fathomTurns", () => {
  it("turns HH:MM:SS start times into turns that end where the next begins", () => {
    const turns = fathomTurns(fixtures.transcripts["9001"] as FathomTranscriptItem[], 31 * 60);
    expect(turns.map((t) => [t.speaker, t.email, t.startS, t.endS])).toEqual([
      ["Peter Hale", "peter@brightside.agency", 2, 9],
      ["Dana Price", "dana@northwind.com", 9, 75],
      ["Peter Hale", "peter@brightside.agency", 75, 80],
      ["Dana Price", "dana@northwind.com", 80, 1860],
    ]);
  });

  it("keeps turns whose speaker has no matched email", () => {
    const turns = fathomTurns(fixtures.transcripts["9002"] as FathomTranscriptItem[], 2730);
    expect(turns[1]).toEqual({ speaker: "Ama Mensah", startS: 120, endS: 2730, text: "How much would this cost?" });
  });

  it("parses timestamps", () => {
    expect(timestampSeconds("01:02:03")).toBe(3723);
    expect(timestampSeconds("bad")).toBe(0);
  });
});
