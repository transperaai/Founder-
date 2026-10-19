import { describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { createCall, createFounder, fixtures } from "../../../tests/fixtures/calls";

const deleteMedia = vi.fn(async (url: string) => void url);
vi.mock("@/lib/media", () => ({ deleteMedia: (url: string) => deleteMedia(url) }));
const { deleteCall } = await import("./delete");

describe("deleteCall", () => {
  it("removes the call's media and every derived record, and unlinks what it shares", async () => {
    await createFounder();
    const call = await createCall(fixtures.discovery);
    await db.call.update({ where: { id: call.id }, data: { mediaUrl: "https://abc.public.blob.vercel-storage.com/calls/x.mp4" } });
    const other = await createCall({ ...fixtures.discovery, title: "Another call" });
    const moment = (callId: string) =>
      db.moment.create({ data: { callId, type: "objection", startS: 1, endS: 2, speaker: "Dana", text: "t", summary: "s" } });
    const m1 = await moment(call.id);
    const m2 = await moment(other.id);

    await db.scorecard.create({ data: { callId: call.id, callType: "discovery", total: 50, habitResults: [] } });
    await db.feedback.create({ data: { callId: call.id, strengths: [], improvements: [], objections: [], missedOpportunities: [] } });
    await db.comparison.create({ data: { callId: other.id, repMomentId: m2.id, founderMomentId: m1.id, differenceNote: "n" } });
    await db.founderComment.create({ data: { callId: call.id, momentId: m1.id, text: "nice" } });
    await db.inboxItem.create({ data: { type: "why_prompt", title: "Why?", body: "b", sourceCallId: call.id, sourceMomentId: m1.id } });
    const opp = await db.opportunity.create({ data: { callId: call.id, momentId: m1.id, description: "Loyalty app", owner: "Peter" } });
    const onlyHere = await db.playbookItem.create({ data: { type: "objection", title: "a", content: "c", sourceMomentIds: [m1.id] } });
    const shared = await db.playbookItem.create({ data: { type: "objection", title: "b", content: "c", sourceMomentIds: [m1.id, m2.id] } });
    const answered = await db.playbookItem.create({ data: { type: "story", title: "c", content: "c", sourceMomentIds: [m1.id], origin: "inbox_answer" } });

    await deleteCall(call.id);

    expect(await db.call.findUnique({ where: { id: call.id } })).toBeNull();
    expect(await db.moment.count({ where: { callId: call.id } })).toBe(0);
    expect(await db.scorecard.count()).toBe(0);
    expect(await db.feedback.count()).toBe(0);
    expect(await db.founderComment.count()).toBe(0);
    expect(await db.inboxItem.count()).toBe(0);
    expect((await db.comparison.findFirstOrThrow()).founderMomentId).toBeNull();
    expect(await db.opportunity.findUniqueOrThrow({ where: { id: opp.id } })).toMatchObject({ callId: null, momentId: null });
    expect(await db.playbookItem.findUnique({ where: { id: onlyHere.id } })).toBeNull();
    expect((await db.playbookItem.findUniqueOrThrow({ where: { id: shared.id } })).sourceMomentIds).toEqual([m2.id]);
    expect((await db.playbookItem.findUniqueOrThrow({ where: { id: answered.id } })).sourceMomentIds).toEqual([]);
    expect(deleteMedia).toHaveBeenCalledWith("https://abc.public.blob.vercel-storage.com/calls/x.mp4");
    expect(await db.call.count()).toBe(1);
  });
});
