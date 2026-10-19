import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "founder-squared" });

/** Inngest runs background jobs when its keys are set (Vercel integration) or the local dev server is in use. */
export const inngestEnabled = () => Boolean(process.env.INNGEST_EVENT_KEY) || process.env.INNGEST_DEV === "1";

export const events = {
  analyseCall: "call/analyse.requested",
} as const;
