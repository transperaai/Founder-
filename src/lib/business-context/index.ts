import { z } from "zod/v4";

export const QUESTIONS = [
  { id: "bestClients", label: "Who are your best clients?" },
  { id: "offerAndDealSize", label: "What do you sell, and what's a typical deal size (retainer or project)?" },
  { id: "whyUs", label: "Why do clients choose you over other agencies?" },
  { id: "dealProcess", label: "How does a typical deal go from first contact to signed?" },
  { id: "whyDealsDontClose", label: "What's the most common reason deals don't close?" },
] as const;

export type QuestionId = (typeof QUESTIONS)[number]["id"];
export type BusinessAnswers = Record<QuestionId, string>;

export const PROFILE_FIELDS = [
  { id: "idealClients", label: "Ideal clients" },
  { id: "offer", label: "Offer" },
  { id: "differentiators", label: "Differentiators" },
  { id: "salesProcess", label: "Sales process" },
  { id: "commonObjections", label: "Common objections" },
] as const;

export const profileSchema = z.object({
  idealClients: z.string(),
  offer: z.string(),
  differentiators: z.string(),
  salesProcess: z.string(),
  commonObjections: z.string(),
});
export type BusinessProfile = z.infer<typeof profileSchema>;

export function answersFromForm(form: FormData): BusinessAnswers {
  return Object.fromEntries(QUESTIONS.map((q) => [q.id, String(form.get(q.id) ?? "").trim()])) as BusinessAnswers;
}

export function profileFromForm(form: FormData): BusinessProfile {
  return Object.fromEntries(PROFILE_FIELDS.map((f) => [f.id, String(form.get(f.id) ?? "").trim()])) as BusinessProfile;
}

/**
 * How saving an edited profile is stored: an unapproved draft is updated in
 * place; once a version is approved, any change creates a new version.
 */
export function profileSaveAction(
  current: { approvedAt: Date | null; profileSummary: BusinessProfile | null },
  edited: BusinessProfile,
): "update" | "new_version" | "approve_only" {
  if (!current.approvedAt) return "update";
  const unchanged = current.profileSummary && PROFILE_FIELDS.every((f) => current.profileSummary![f.id] === edited[f.id]);
  return unchanged ? "approve_only" : "new_version";
}
