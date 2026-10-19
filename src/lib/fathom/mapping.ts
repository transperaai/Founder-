import { clientDomainFor } from "@/lib/calls/domain";
import { normaliseTurns, type Turn } from "@/lib/calls/transcript";
import type { FathomMeeting, FathomTranscriptItem } from "./client";

/** What the import picker shows for each meeting, and what an import starts from. */
export type MeetingSummary = {
  recordingId: string;
  title: string;
  startedAt: string;
  durationS: number;
  attendeeEmails: string[];
};

const seconds = (from?: string | null, to?: string | null) =>
  from && to ? Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 1000)) : 0;

export function meetingSummary(meeting: FathomMeeting): MeetingSummary {
  const start = meeting.recording_start_time ?? meeting.scheduled_start_time ?? meeting.created_at;
  const end = meeting.recording_end_time ?? meeting.scheduled_end_time;
  const emails = [meeting.recorded_by?.email, ...(meeting.calendar_invitees ?? []).map((i) => i.email)]
    .filter((e): e is string => Boolean(e))
    .map((e) => e.trim().toLowerCase());
  return {
    recordingId: String(meeting.recording_id),
    title: meeting.title || meeting.meeting_title || "Untitled meeting",
    startedAt: new Date(start).toISOString(),
    durationS: seconds(start, end),
    attendeeEmails: [...new Set(emails)],
  };
}

/** "01:02:03" → 3723. */
export function timestampSeconds(timestamp: string) {
  const parts = timestamp.split(":").map(Number);
  if (parts.some((n) => !Number.isFinite(n))) return 0;
  return parts.reduce((total, n) => total * 60 + n, 0);
}

/**
 * Fathom transcript items carry only a start time; each turn ends where the
 * next begins, and the last ends with the recording.
 */
export function fathomTurns(items: FathomTranscriptItem[], durationS: number): Turn[] {
  const raw = items.map((item, i) => {
    const startS = timestampSeconds(item.timestamp);
    const next = items[i + 1];
    const endS = next ? timestampSeconds(next.timestamp) : durationS > startS ? durationS : undefined;
    return { speaker: item.speaker.display_name, email: item.speaker.matched_calendar_invitee_email ?? undefined, startS, endS, text: item.text };
  });
  return normaliseTurns(raw).turns;
}

/** The Call fields an import stores up front, before the transcript arrives. */
export function callFromSummary(meeting: MeetingSummary, founderDomain: string | null) {
  return {
    source: "fathom" as const,
    fathomRecordingId: meeting.recordingId,
    title: meeting.title,
    startedAt: new Date(meeting.startedAt),
    durationS: meeting.durationS,
    transcript: [],
    attendeeEmails: meeting.attendeeEmails,
    clientDomain: clientDomainFor(meeting.attendeeEmails, founderDomain),
    status: "importing" as const,
  };
}
