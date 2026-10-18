import type { MomentType, PlaybookItemType } from "@prisma/client";

export const businessContextAnswers = {
  bestClients:
    "Mid-sized consumer brands (£5–50m revenue) with an in-house marketing lead but no digital team. Retail, health and hospitality do best.",
  offerAndDealSize:
    "Ecommerce sites, retention and email programmes, and paid social. Typical deal is a £30–60k project followed by a £5–8k monthly retainer.",
  whyUs:
    "We tie everything to repeat revenue, not vanity metrics, and the people in the pitch are the people who do the work.",
  dealProcess:
    "Intro call, discovery call, proposal walkthrough two weeks later, then terms. Usually 4–8 weeks from first contact to signed.",
  whyDealsDontClose:
    "Budget timing. Clients like the plan but procurement or the board pushes it to the next quarter, or asks for a discount we can't give.",
};

export const businessContextProfile = {
  idealClients: "Mid-sized consumer brands (£5–50m) in retail, health and hospitality with a marketing lead but no in-house digital team.",
  offer: "Ecommerce builds, retention and email programmes and paid social: a £30–60k project, then a £5–8k/month retainer.",
  differentiators: "Everything is measured on repeat revenue, and the pitch team is the delivery team.",
  salesProcess: "Intro → discovery → proposal walkthrough (≈2 weeks) → terms. 4–8 weeks to signature.",
  commonObjections: "Price versus cheaper agencies, bad experience with a previous agency, and budget timing pushed by procurement or the board.",
};

/** Source references are (index into founderCalls, moment type). */
type Src = [number, MomentType];

export type PlaybookSeed = {
  type: PlaybookItemType;
  title: string;
  content: string;
  sources: Src[];
  filterReason?: string;
};

export const playbook: PlaybookSeed[] = [
  // Objections and how Peter handles them
  { type: "objection", title: "\"Our last agency never moved the numbers\"", content: "Acknowledge it (\"I'd feel the same\"), ask what 'moving the numbers' would look like for them, then tell a similar client story with a specific result.", sources: [[0, "objection"], [3, "objection"], [7, "objection"]] },
  { type: "objection", title: "\"You're more expensive than the other agency\"", content: "Thank them for being straight, ask whether the issue is the total or the timing of payments, and offer to phase the project so spend follows their launch.", sources: [[1, "objection"], [4, "objection"], [9, "objection"]] },
  { type: "objection", title: "\"The invoice was higher than quoted\"", content: "Own it immediately (\"we should have flagged it earlier\"), then agree a rule: a heads-up when spend passes 80% of budget.", sources: [[8, "objection"], [11, "objection"]] },
  { type: "objection", title: "\"Procurement wants a better rate\"", content: "Ask exactly what procurement asked for and why. Only trade price for commitment (term length, start date), never for nothing.", sources: [[2, "pricing"], [10, "pricing"]] },
  // Techniques
  { type: "technique", title: "Ask before answering \"what does it cost?\"", content: "When a client opens with price, acknowledge it and ask what made them start looking now. Price lands better once the problem is clear.", sources: [[0, "discovery_question"], [3, "discovery_question"], [7, "discovery_question"]] },
  { type: "technique", title: "Phase the spend to match their calendar", content: "If budget is the blocker, split the project so payments follow the client's launch or financial quarter.", sources: [[1, "objection"], [4, "objection"]] },
  { type: "technique", title: "Results first in account reviews", content: "Open quarterly reviews with two numbers tied to revenue before discussing anything else.", sources: [[8, "value_story"], [11, "value_story"]] },
  // Discovery questions
  { type: "question", title: "\"What made you start looking now?\"", content: "Peter's go-to 'why now' question. It surfaces the deadline (board, launch, season) that drives the deal.", sources: [[0, "discovery_question"], [3, "discovery_question"], [7, "discovery_question"]] },
  { type: "question", title: "\"What have you tried so far, and how did it go?\"", content: "Uncovers past agency experiences and the objection you'll need to handle later.", sources: [[0, "discovery_question"], [3, "discovery_question"], [7, "discovery_question"]] },
  { type: "question", title: "\"What are your priorities for next quarter?\"", content: "Asked in every account review. It is where most upsell opportunities come from.", sources: [[8, "discovery_question"], [11, "discovery_question"]] },
  { type: "question", title: "\"Has anything changed since we last spoke?\"", content: "Opens every pitch, so the proposal is pitched at today's situation, not last month's.", sources: [[1, "discovery_question"], [4, "discovery_question"], [9, "discovery_question"]] },
  // Stories
  { type: "story", title: "Retailer: repeat orders +22% in six months", content: "A retailer stuck on flat online sales. Retention programme plus email rebuild lifted repeat orders 22% in six months.", sources: [[0, "value_story"], [3, "value_story"], [7, "value_story"]] },
  { type: "story", title: "Health brand launch: 140% of first-month target", content: "Rebuilt product pages and ran the launch campaign for a health brand; they hit 140% of their first-month target.", sources: [[1, "value_story"], [4, "value_story"]] },
  { type: "story", title: "Quarterly results: traffic +31%, email 18% of revenue", content: "The two numbers Peter uses to open reviews: organic traffic growth and the share of revenue from email.", sources: [[8, "value_story"], [11, "value_story"]] },
  // Buying signals
  { type: "buying_signal", title: "\"Who would be working on our account?\"", content: "When a client asks who does the work, they are picturing working with you. Move to next steps.", sources: [[0, "buying_signal"], [3, "buying_signal"], [7, "buying_signal"]] },
  { type: "buying_signal", title: "\"When could you start?\"", content: "A start-date question after a price objection means the objection is handled. Propose a date and a decision meeting.", sources: [[1, "buying_signal"], [4, "buying_signal"]] },
  { type: "buying_signal", title: "Client mentions next year's projects", content: "Plans like a loyalty app or a new market are opportunities. Offer a short note and book time to discuss.", sources: [[8, "buying_signal"], [11, "buying_signal"]] },
  // Awareness
  { type: "awareness", title: "Problem-aware clients: no services until the problem is agreed", content: "If the client knows the symptom (flat sales) but not the cause, stay in questions until they agree on the problem. Then tell a story, then the offer.", sources: [[0, "client_need"], [3, "client_need"], [7, "client_need"]] },
  { type: "awareness", title: "Product-aware clients: go straight to proof and terms", content: "Clients comparing agencies want proof and a plan. Recap, one story, the price, then handle the objection.", sources: [[1, "client_need"], [4, "client_need"]] },
  // Talk tracks
  { type: "talk_track", title: "Discovery opener", content: "\"I've got us down for 45 minutes: I'd like to understand where you are today, then share how we might help. What would make this call useful for you?\"", sources: [[0, "opening"], [3, "opening"], [7, "opening"]] },
  { type: "talk_track", title: "Pitch opener", content: "\"We have 30 minutes. I'll recap what we heard, walk through the plan, then leave time for questions. Anything you want to make sure we cover?\"", sources: [[1, "opening"], [4, "opening"], [9, "opening"]] },
  { type: "talk_track", title: "Discovery close", content: "Summarise their need in their words, commit to a proposal by a named day, book the walkthrough and ask who else should join.", sources: [[0, "next_steps"], [3, "next_steps"], [7, "next_steps"]] },
  { type: "talk_track", title: "Review close", content: "\"I'll put together a short note on that by Wednesday and book 30 minutes on the 21st to walk through it.\"", sources: [[8, "next_steps"], [11, "next_steps"]] },
  // Decision rules
  { type: "decision_rule", title: "Discount only for commitment", content: "Up to 10% off the retainer, only in exchange for a 12-month term and a start this month.", sources: [[2, "decision"]] },
  { type: "decision_rule", title: "Walk away below a workable rate", content: "If the client needs more than 10% off, decline politely rather than under-deliver, and leave the door open.", sources: [[10, "decision"]] },
  // Filtered by the EQHQ quality filter
  { type: "technique", title: "Hold firm on price, no explanation", content: "\"Our price reflects our quality. I don't think we can move on that.\"", sources: [[6, "objection"]], filterReason: "Appears only in lost deals." },
  { type: "talk_track", title: "\"We're not like that agency\"", content: "\"We're not like that agency. Our retention programme is proven and the pricing is fair.\"", sources: [[5, "objection"]], filterReason: "Answers the objection without acknowledging it or asking a question, which conflicts with the framework's structure. Also appears only in lost deals." },
  { type: "decision_rule", title: "Throw in an extra month free", content: "Peter offered a free month to close a hesitant client.", sources: [[2, "decision"]], filterReason: "A concession with no stated reason." },
  { type: "technique", title: "Call the CEO directly", content: "When a deal stalls, Peter calls the client's CEO, whom he knows personally.", sources: [[9, "next_steps"]], filterReason: "Depends on the founder's personal relationship, which reps can't do." },
];

/** One founder clip per common moment type, cut from the sample recording. */
export const placeholderClips: { momentType: MomentType; title: string; transcript: string; startS: number; endS: number }[] = [
  { momentType: "opening", title: "Peter opens a discovery call", transcript: "I've got us down for 45 minutes: I'd like to understand where you are today, then share how we might help. What would make this call useful for you?", startS: 0, endS: 14 },
  { momentType: "discovery_question", title: "Peter asks \"why now?\"", transcript: "Before I answer that, what made you start looking for an agency now?", startS: 30, endS: 38 },
  { momentType: "objection", title: "Peter handles \"too expensive\"", transcript: "I appreciate you being straight with me. Help me understand: is it the total, or the timing of the payments?", startS: 60, endS: 76 },
  { momentType: "pricing", title: "Peter presents the price", transcript: "The plan is a 12-week project at £48,000, then a monthly retainer of £6,500 for campaigns.", startS: 90, endS: 100 },
  { momentType: "value_story", title: "Peter tells the retailer story", transcript: "A retailer in a similar spot saw repeat orders up 22% in six months with us.", startS: 120, endS: 134 },
  { momentType: "next_steps", title: "Peter books a dated next step", transcript: "I'll send a proposal by Thursday and we'll go through it on the 14th. Who else should join from your side?", startS: 150, endS: 164 },
];
