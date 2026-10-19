import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import fixtures from "../../../tests/fake-fathom/fixtures.json";
import { createFakeFathom, VALID_KEY } from "../../../tests/fake-fathom/server";
import { createCall, createFounder, fixtures as callFixtures } from "../../../tests/fixtures/calls";
import { createFathomClient, type FathomMeeting } from "./client";
import { createImportedCalls, importTranscript, needsImport } from "./import";
import { meetingSummary } from "./mapping";

const fake = createFakeFathom();
let fathom: ReturnType<typeof createFathomClient>;
beforeAll(async () => {
  fathom = createFathomClient({ apiKey: VALID_KEY, baseUrl: await fake.start() });
});
afterAll(() => fake.stop());

const meetings = [...fixtures.pages[0].items, ...fixtures.pages[1].items].map((m) => meetingSummary(m as FathomMeeting));

describe("Fathom import", () => {
  it("creates one importing founder call per selected meeting, with attendees and client domain", async () => {
    await createFounder();
    const ids = await createImportedCalls(meetings.slice(0, 2));
    expect(ids).toHaveLength(2);

    const northwind = await db.call.findUniqueOrThrow({ where: { fathomRecordingId: "9001" } });
    expect(northwind).toMatchObject({
      source: "fathom",
      role: "founder",
      status: "importing",
      title: "Northwind Retail <> Brightside",
      durationS: 1860,
      clientDomain: "northwind.com",
      attendeeEmails: ["peter@brightside.agency", "dana@northwind.com", "lee@northwind.com"],
    });
    expect(needsImport(northwind)).toBe(true);
  });

  it("never duplicates a meeting imported twice", async () => {
    await createFounder();
    await createImportedCalls(meetings.slice(0, 2));
    const second = await createImportedCalls(meetings);
    expect(second).toHaveLength(1);
    expect(await db.call.count()).toBe(3);
  });

  it("stores the transcript as normalised speaker turns, and re-running doesn't change it", async () => {
    await createFounder();
    const [id] = await createImportedCalls(meetings.slice(0, 1));
    await importTranscript(id, { fathom });
    const first = await db.call.findUniqueOrThrow({ where: { id } });
    expect(first.transcript).toEqual([
      { speaker: "Peter Hale", email: "peter@brightside.agency", startS: 2, endS: 9, text: "Thanks for making time, Dana. I've got us down for 30 minutes." },
      { speaker: "Dana Price", email: "dana@northwind.com", startS: 9, endS: 75, text: "Sounds good. Online sales flattened this year." },
      { speaker: "Peter Hale", email: "peter@brightside.agency", startS: 75, endS: 80, text: "What have you tried so far?" },
      { speaker: "Dana Price", email: "dana@northwind.com", startS: 80, endS: 1860, text: "We had an agency last year and never saw the numbers move." },
    ]);
    expect(needsImport(first)).toBe(false);

    await importTranscript(id, { fathom });
    expect((await db.call.findUniqueOrThrow({ where: { id } })).transcript).toEqual(first.transcript);
    expect(await db.call.count()).toBe(1);
  });

  it("fails with a readable reason when Fathom isn't connected", async () => {
    await createFounder();
    const [id] = await createImportedCalls(meetings.slice(0, 1));
    const error = await importTranscript(id).catch((e) => e);
    expect(error.name).toBe("PipelineError");
    expect(error.message).toMatch(/Fathom isn't connected/);
  });

  it("refuses a call that didn't come from Fathom", async () => {
    await createFounder();
    const call = await createCall(callFixtures.discovery);
    expect((await importTranscript(call.id, { fathom }).catch((e) => e)).message).toMatch(/didn't come from Fathom/);
  });
});
