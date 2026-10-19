import "server-only";
import { decrypt } from "@/lib/crypto";
import { getFounder } from "@/lib/founder";
import { createFathomClient } from "./client";

export type FathomKeySource = "saved" | "default";

/**
 * The Fathom key to use: a key saved in Settings (encrypted) wins; otherwise
 * the deployment's FATHOM_API_KEY, unless the founder removed the connection.
 */
export function resolveFathomKey(
  user: { fathomApiKey: string | null; fathomUseDefaultKey: boolean } | null,
  defaultKey = process.env.FATHOM_API_KEY?.trim(),
): { key: string; source: FathomKeySource } | null {
  if (user?.fathomApiKey) return { key: decrypt(user.fathomApiKey), source: "saved" };
  if (defaultKey && (user?.fathomUseDefaultKey ?? true)) return { key: defaultKey, source: "default" };
  return null;
}

/** A Fathom client with the founder's key, or null when Fathom isn't connected. */
export async function founderFathomClient() {
  const resolved = resolveFathomKey(await getFounder());
  return resolved ? createFathomClient({ apiKey: resolved.key }) : null;
}
