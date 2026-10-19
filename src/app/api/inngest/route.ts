import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { functions } from "@/inngest/functions";

// Analysis runs several model calls; give each step room.
export const maxDuration = 300;

export const { GET, POST, PUT } = serve({ client: inngest, functions });
