import "server-only";
import { emailDomain } from "@/lib/calls/domain";
import { db } from "@/lib/db";

/** The founder: the first user, and the only real account in a deployment. */
export const getFounder = () => db.user.findFirst({ orderBy: { createdAt: "asc" } });

/** The founder's email domain; attendees on it are "us". */
export async function founderDomain() {
  const founder = await getFounder();
  return founder ? emailDomain(founder.email) : null;
}
