import type { CallRole, CallType } from "@prisma/client";

export const emailDomain = (email: string) => email.trim().toLowerCase().split("@")[1] ?? "";

/** A call is internal when every attendee shares the founder's email domain. */
export function isInternalCall(attendeeEmails: string[], founderDomain: string | null) {
  if (!founderDomain || attendeeEmails.length === 0) return false;
  return attendeeEmails.every((email) => emailDomain(email) === founderDomain);
}

/** The client side of a call: the most common attendee domain that isn't the founder's. */
export function clientDomainFor(attendeeEmails: string[], founderDomain: string | null): string | null {
  const counts = new Map<string, number>();
  for (const email of attendeeEmails) {
    const domain = emailDomain(email);
    if (domain && domain !== founderDomain) counts.set(domain, (counts.get(domain) ?? 0) + 1);
  }
  let best: string | null = null;
  for (const [domain, count] of counts) if (best === null || count > counts.get(best)!) best = domain;
  return best;
}

/** How a call arrived. Onboarding imports teach (founder); later webhook arrivals get coached (rep). */
export type CallOrigin = "onboarding_import" | "webhook" | "upload";
export const defaultRoleFor = (origin: CallOrigin): CallRole => (origin === "webhook" ? "rep" : "founder");

/** Where a call type usually sits in a deal; stored as moment context. */
export const dealStageFor: Record<CallType, string> = {
  discovery: "early",
  pitch: "proposal",
  negotiation: "closing",
  account_review: "existing_client",
  internal: "none",
};
