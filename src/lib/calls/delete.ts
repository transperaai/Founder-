import "server-only";
import { db } from "@/lib/db";
import { deleteMedia } from "@/lib/media";

/**
 * Deletes a call with its media and everything derived from it. The schema
 * cascades moments, scorecard, feedback, comparisons, comments and inbox items,
 * and unlinks opportunities. Playbook items only hold moment ids, so they're
 * handled here: refs to this call are dropped, and an extracted item left with
 * no source is deleted.
 */
export async function deleteCall(callId: string) {
  const call = await db.call.findUnique({ where: { id: callId }, select: { mediaUrl: true, moments: { select: { id: true } } } });
  if (!call) return;
  const momentIds = new Set(call.moments.map((m) => m.id));

  await db.$transaction(async (tx) => {
    const items = await tx.playbookItem.findMany({ where: { sourceMomentIds: { hasSome: [...momentIds] } } });
    for (const item of items) {
      const remaining = item.sourceMomentIds.filter((id) => !momentIds.has(id));
      if (remaining.length === 0 && item.origin === "extracted") {
        await tx.playbookItem.delete({ where: { id: item.id } });
      } else {
        await tx.playbookItem.update({ where: { id: item.id }, data: { sourceMomentIds: remaining } });
      }
    }
    await tx.call.delete({ where: { id: callId } });
  });

  if (call.mediaUrl) {
    await deleteMedia(call.mediaUrl).catch(() => console.error(`media delete failed for call ${callId}`));
  }
}
