import type { CallRole } from "@prisma/client";
import { db } from "@/lib/db";
import discovery from "./discovery-northwind.json";
import internal from "./internal-standup.json";

export const fixtures = { discovery, internal };

/** The founder whose domain decides what's internal. */
export const createFounder = () => db.user.create({ data: { name: "Peter Hale", email: "peter@brightside.agency" } });

export type CallFixture = {
  title: string;
  durationS: number;
  attendeeEmails: string[];
  transcript: { speaker: string; email?: string; startS: number; endS?: number; text: string }[];
};

/** Stores a fixture call as freshly imported, ready for the pipeline. */
export function createCall(fixture: CallFixture, role: CallRole = "founder") {
  return db.call.create({
    data: {
      source: "fathom",
      title: fixture.title,
      startedAt: new Date("2026-10-01T10:00:00Z"),
      durationS: fixture.durationS,
      transcript: fixture.transcript,
      attendeeEmails: fixture.attendeeEmails,
      role,
    },
  });
}
