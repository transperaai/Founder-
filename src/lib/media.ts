import "server-only";
import { del } from "@vercel/blob";

/** Deletes a call's stored media. Bundled demo files (relative paths) are shared and never deleted. */
export async function deleteMedia(url: string) {
  if (!/^https:\/\/[^/]+\.blob\.vercel-storage\.com\//.test(url)) return;
  await del(url);
}
