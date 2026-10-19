import { z } from "zod/v4";

/** A normalised speaker turn, as stored in `Call.transcript`. */
export type Turn = { speaker: string; email?: string | null; startS: number; endS: number; text: string };

const rawTurnSchema = z.object({
  speaker: z.string(),
  email: z.string().nullish(),
  startS: z.number(),
  endS: z.number().nullish(),
  text: z.string(),
});

/** Seconds a turn takes when its end time is unknown: roughly 2.5 words a second. */
const estimatedDuration = (text: string) => Math.max(1, Math.round(text.trim().split(/\s+/).length / 2.5));

/**
 * Ensures speaker turns are ordered and every turn has an end time.
 * `changed` is false when the input was already normalised, so callers can skip the write.
 */
export function normaliseTurns(raw: unknown): { turns: Turn[]; changed: boolean } {
  const parsed = z.array(rawTurnSchema).safeParse(raw);
  if (!parsed.success) throw new Error("Transcript isn't a list of speaker turns");

  const kept = parsed.data.filter((t) => t.text.trim() !== "").sort((a, b) => a.startS - b.startS);
  const turns = kept.map((t, i): Turn => {
    const next = kept[i + 1];
    const fallbackEnd = next && next.startS > t.startS ? next.startS : t.startS + estimatedDuration(t.text);
    const endS = t.endS != null && t.endS >= t.startS ? t.endS : fallbackEnd;
    return {
      speaker: t.speaker.trim() || "Unknown speaker",
      ...(t.email ? { email: t.email.toLowerCase() } : {}),
      startS: t.startS,
      endS,
      text: t.text.trim(),
    };
  });
  // Stored transcripts use this exact shape, so an unchanged serialisation means nothing to write.
  const changed = JSON.stringify(turns) !== JSON.stringify(raw);
  return { turns, changed };
}

/** Turns that start within the first `seconds` of the call. */
export const firstSeconds = (turns: Turn[], seconds: number) => turns.filter((t) => t.startS < seconds);

/** Verbatim text of the turns overlapping [startS, endS]. */
export function excerpt(turns: Turn[], startS: number, endS: number) {
  return turns
    .filter((t) => t.startS <= endS && t.endS >= startS)
    .map((t) => `${t.speaker}: ${t.text}`)
    .join("\n");
}

/** Transcript as prompt text, one turn per line with times in whole seconds. */
export const formatTurns = (turns: Turn[]) =>
  turns.map((t) => `[${Math.floor(t.startS)}s–${Math.ceil(t.endS)}s] ${t.speaker}: ${t.text}`).join("\n");
