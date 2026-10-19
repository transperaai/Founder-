import type { CallOutcome, CallRole, CallSource, CallStatus, CallType } from "@prisma/client";

export const callTypeLabel: Record<CallType, string> = {
  discovery: "Discovery",
  pitch: "Pitch",
  account_review: "Account review",
  negotiation: "Negotiation",
  internal: "Internal",
};

export const outcomeLabel: Record<CallOutcome, string> = { won: "Won", lost: "Lost", open: "Open" };
export const roleLabel: Record<CallRole, string> = { founder: "Founder", rep: "Rep" };
export const sourceLabel: Record<CallSource, string> = { fathom: "Fathom", upload: "Upload" };
export const statusLabel: Record<CallStatus, string> = {
  importing: "Importing",
  analysing: "Analysing",
  ready: "Ready",
  skipped: "Skipped",
  error: "Error",
};

export function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}
