import { z } from "zod/v4";

// Fathom external API (https://developers.fathom.ai). API key auth via X-Api-Key.
// Only the fields Founder² uses are validated; everything else passes through.

export const FATHOM_BASE_URL = "https://api.fathom.ai/external/v1";

const inviteeSchema = z.object({
  name: z.string().nullish(),
  email: z.string().nullish(),
  email_domain: z.string().nullish(),
  is_external: z.boolean().nullish(),
});

const transcriptItemSchema = z.object({
  speaker: z.object({ display_name: z.string(), matched_calendar_invitee_email: z.string().nullish() }),
  text: z.string(),
  /** HH:MM:SS from the start of the meeting. */
  timestamp: z.string(),
});
export type FathomTranscriptItem = z.infer<typeof transcriptItemSchema>;

const meetingSchema = z.object({
  title: z.string().nullish(),
  meeting_title: z.string().nullish(),
  recording_id: z.number(),
  url: z.string().nullish(),
  created_at: z.string(),
  recording_start_time: z.string().nullish(),
  recording_end_time: z.string().nullish(),
  scheduled_start_time: z.string().nullish(),
  scheduled_end_time: z.string().nullish(),
  recorded_by: z.object({ name: z.string().nullish(), email: z.string().nullish() }).nullish(),
  calendar_invitees: z.array(inviteeSchema).nullish(),
  transcript: z.array(transcriptItemSchema).nullish(),
});
export type FathomMeeting = z.infer<typeof meetingSchema>;

const meetingListSchema = z.object({
  items: z.array(meetingSchema),
  next_cursor: z.string().nullish(),
  limit: z.number().nullish(),
});

const transcriptResponseSchema = z.object({ transcript: z.array(transcriptItemSchema) });

export type FathomErrorCode = "unauthorized" | "rate_limited" | "not_found" | "bad_request" | "unavailable" | "invalid_response";

export class FathomError extends Error {
  name = "FathomError";
  constructor(
    readonly code: FathomErrorCode,
    message: string,
    /** Seconds to wait before retrying, from Retry-After on a 429. */
    readonly retryAfterS?: number,
  ) {
    super(message);
  }
}

const messages: Record<FathomErrorCode, string> = {
  unauthorized: "Fathom rejected the API key. Check it in Fathom under Settings → API Access.",
  rate_limited: "Fathom is rate limiting requests. Try again in a minute.",
  not_found: "Fathom couldn't find that recording.",
  bad_request: "Fathom rejected the request.",
  unavailable: "Fathom didn't respond. Try again in a minute.",
  invalid_response: "Fathom returned something we couldn't read.",
};

/**
 * A typed error whose message names the cause (status, network error code or
 * the field that didn't match), so failures are diagnosable. Paths and causes
 * carry no client data.
 */
function failure(code: FathomErrorCode, path: string, cause: string, retryAfterS?: number) {
  console.error(`Fathom ${path} failed: ${cause}`);
  return new FathomError(code, `${messages[code]} (${cause})`, retryAfterS);
}

/** The most specific code from a fetch failure, e.g. ENOTFOUND or UND_ERR_CONNECT_TIMEOUT. */
function networkCause(error: unknown) {
  type Cause = { code?: string; message?: string; errors?: Cause[] };
  const cause = (error as { cause?: Cause })?.cause;
  // Connection failures can arrive as an AggregateError of per-address attempts.
  return cause?.code ?? cause?.errors?.[0]?.code ?? cause?.message ?? (error as Error)?.name ?? "unknown";
}

export type FathomClient = ReturnType<typeof createFathomClient>;

export function createFathomClient({
  apiKey,
  baseUrl = process.env.FATHOM_API_BASE_URL || FATHOM_BASE_URL,
  fetch: fetchImpl = globalThis.fetch,
}: {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
}) {
  async function get<S extends z.ZodType>(path: string, params: Record<string, string | undefined>, schema: S): Promise<z.infer<S>> {
    const url = new URL(baseUrl.replace(/\/$/, "") + path);
    for (const [k, v] of Object.entries(params)) if (v !== undefined) url.searchParams.set(k, v);

    let res: Response;
    try {
      res = await fetchImpl(url, { headers: { "X-Api-Key": apiKey, Accept: "application/json" }, cache: "no-store" });
    } catch (error) {
      throw failure("unavailable", path, `network error: ${networkCause(error)}`);
    }
    if (!res.ok) {
      const code: FathomErrorCode =
        res.status === 401 || res.status === 403 ? "unauthorized"
        : res.status === 429 ? "rate_limited"
        : res.status === 404 ? "not_found"
        : res.status >= 500 ? "unavailable"
        : "bad_request";
      const retryAfter = Number(res.headers.get("retry-after"));
      throw failure(code, path, `HTTP ${res.status}`, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined);
    }
    const body = await res.json().catch(() => undefined);
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw failure("invalid_response", path, `unexpected shape at ${parsed.error.issues[0]?.path.join(".") || "root"}`);
    return parsed.data;
  }

  return {
    /** One page of meetings, newest first. Pass `nextCursor` back as `cursor` for the next page. */
    async listMeetings({ cursor }: { cursor?: string } = {}) {
      const page = await get("/meetings", { cursor }, meetingListSchema);
      return { meetings: page.items, nextCursor: page.next_cursor ?? null };
    },
    /** The transcript of one recording. */
    async getTranscript(recordingId: string | number) {
      const { transcript } = await get(`/recordings/${encodeURIComponent(String(recordingId))}/transcript`, {}, transcriptResponseSchema);
      return transcript;
    },
  };
}
