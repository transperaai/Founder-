import type { CallOutcome, CallRole, CallType, MomentType } from "@prisma/client";

// Synthetic demo calls. Each call is built from a short script for its call
// type; lines tagged with a moment type become Moments.

export const FOUNDER = { name: "Peter Hale", email: "peter@brightside.agency" };
export const REP = { name: "Sam Okafor", email: "sam@brightside.agency" };
export const AGENCY_DOMAIN = "brightside.agency";

type Line = { us: boolean; text: string; moment?: MomentType };

export type CallSeed = {
  title: string;
  company: string;
  contact: string;
  domain: string;
  type: CallType;
  outcome: CallOutcome;
  role: CallRole;
  daysAgo: number;
  /** Target score used to pick habit results; the stored total is computed. */
  targetScore: number;
  lines: Line[];
};

const discovery = (lost: boolean): Line[] => [
  { us: true, moment: "opening", text: "Thanks for making time, {n}. I've got us down for 45 minutes: I'd like to understand where {c} is today, then share how we might help. What would make this call useful for you?" },
  { us: false, moment: "client_need", text: "Mainly I want to know whether you've done this kind of work before, and roughly what it costs." },
  { us: true, moment: "discovery_question", text: "Fair. Before I answer that, what made you start looking for an agency now?" },
  { us: false, moment: "client_need", text: "Online sales flattened this year and the board wants a plan before Q3. Repeat orders are the big worry." },
  { us: true, moment: "discovery_question", text: "What have you tried so far, and how did it go?" },
  { us: false, moment: "objection", text: "We had an agency last year. Honestly, they were expensive and we never saw the numbers move." },
  lost
    ? { us: true, text: "We're not like that agency. Our retention programme is proven and the pricing is fair." }
    : { us: true, moment: "value_story", text: "That's a fair worry, and I'd feel the same. What would 'the numbers moving' look like for you? For context, a retailer in a similar spot saw repeat orders up 22% in six months with us." },
  { us: false, moment: lost ? "small_talk" : "buying_signal", text: lost ? "Okay. I'd need to think about it." : "That's the kind of result we'd need. Who would be working on our account day to day?" },
  { us: true, moment: "next_steps", text: lost ? "Sure. I'll send something over." : "So you need repeat orders back up before Q3, without another expensive retainer that doesn't move the numbers. I'll send a proposal by Thursday and we'll go through it on the 14th. Who else should join from your side?" },
  { us: false, moment: lost ? undefined : "decision", text: lost ? "Fine, thanks." : "I'll bring our finance director. The 14th works." },
];

const pitch = (lost: boolean): Line[] => [
  { us: true, moment: "opening", text: "Thanks, {n}. We have 30 minutes. I'll recap what we heard, walk through the plan, then leave time for questions. Anything you want to make sure we cover?" },
  { us: false, moment: "client_need", text: "Just the budget, and how quickly we'd see results." },
  { us: true, moment: "discovery_question", text: "Before the plan: has anything changed since we last spoke? And why is this the right time for {c}?" },
  { us: false, moment: "client_need", text: "Our new product line launches in spring, so we need the site and campaigns ready by then." },
  { us: true, moment: "value_story", text: "That fits. For a health brand launching last spring, we rebuilt the product pages and ran the launch campaign. They hit 140% of their first-month target." },
  { us: true, moment: "pricing", text: "The plan is a 12-week project at £48,000, then a monthly retainer of £6,500 for campaigns." },
  { us: false, moment: "objection", text: "That's more than we budgeted. The other agency came in lower." },
  lost
    ? { us: true, text: "Our price reflects our quality. I don't think we can move on that." }
    : { us: true, text: "I appreciate you being straight with me. Help me understand: is it the total, or the timing of the payments? We can phase the project so the spend follows your launch." },
  { us: false, moment: lost ? undefined : "buying_signal", text: lost ? "I'll have to take it back to the team." : "Phasing would help. If we did that, when could you start?" },
  { us: true, moment: "next_steps", text: lost ? "Let me know what they think." : "We could start on the 3rd. I'll send the phased version tomorrow; can we confirm on Friday with you and your CEO?" },
];

const accountReview = (strong: boolean): Line[] => [
  { us: true, moment: "opening", text: "Hi {n}. Quarterly review today, 40 minutes. I'll cover results, then I'd like to hear what's coming up for you. Anything you want to add to the agenda?" },
  { us: false, moment: "client_need", text: "I'd like to talk about why last month's campaign cost more than quoted." },
  { us: true, moment: "value_story", text: "Results first: organic traffic is up 31% this quarter and the email programme drove 18% of revenue." },
  { us: false, moment: "objection", text: "Good, but the invoice was 15% over and nobody warned us." },
  strong
    ? { us: true, text: "You're right to raise it, and we should have flagged it earlier. What would have helped: a heads-up when we pass 80% of budget?" }
    : { us: true, text: "Sorry about that. The campaign needed extra hours for the creative." },
  { us: false, text: "A heads-up would help, yes." },
  { us: true, moment: "discovery_question", text: strong ? "Looking ahead, what are your priorities for next quarter?" : "Is there anything else on your mind?" },
  { us: false, moment: "buying_signal", text: "We're thinking about a loyalty app next year, and the board wants to expand into Ireland." },
  { us: true, moment: "next_steps", text: strong ? "Both are areas we can help with. I'll put together a short note on the loyalty app by Wednesday and book 30 minutes on the 21st to walk through it." : "Interesting. Let's keep in touch about that." },
];

const negotiation = (walkAway: boolean): Line[] => [
  { us: true, moment: "opening", text: "Thanks for coming back to us, {n}. 30 minutes to land the terms. What do you need from today?" },
  { us: false, moment: "client_need", text: "We want to sign, but procurement is asking for a better rate." },
  { us: true, moment: "discovery_question", text: "Understood. What exactly has procurement asked for, and what's driving it?" },
  { us: false, moment: "pricing", text: "They want 15% off the retainer, or they'll go to tender." },
  walkAway
    ? { us: true, moment: "decision", text: "I appreciate the honesty. At 15% off we can't do the work properly, so I'd rather walk away than under-deliver. If anything changes, I'd love to talk again." }
    : { us: true, moment: "decision", text: "We can do 10% off if you commit to 12 months and we start this month. That keeps the team you met on your account." },
  { us: false, moment: walkAway ? "objection" : "buying_signal", text: walkAway ? "That's disappointing. I'll let procurement know." : "Twelve months is fine. I think we can sign that." },
  { us: true, moment: "next_steps", text: walkAway ? "Thanks, {n}. Good luck with the tender." : "Great. I'll send the contract today; can you get it signed by Friday? Is anyone besides procurement involved in signing?" },
];

const scripts: Record<Exclude<CallType, "internal">, (variant: boolean) => Line[]> = {
  discovery,
  pitch,
  account_review: accountReview,
  negotiation,
};

const call = (
  title: string,
  company: string,
  contact: string,
  domain: string,
  type: Exclude<CallType, "internal">,
  outcome: CallOutcome,
  role: CallRole,
  daysAgo: number,
  targetScore: number,
  variant: boolean,
): CallSeed => ({
  title,
  company,
  contact,
  domain,
  type,
  outcome,
  role,
  daysAgo,
  targetScore,
  // discovery/pitch take "lost"; account_review takes "strong"; negotiation takes "walkAway"
  lines: scripts[type](variant),
});

export const founderCalls: CallSeed[] = [
  call("Northwind Retail – intro", "Northwind Retail", "Dana", "northwindretail.com", "discovery", "won", "founder", 120, 85, false),
  call("Northwind Retail – proposal", "Northwind Retail", "Dana", "northwindretail.com", "pitch", "won", "founder", 110, 88, false),
  call("Northwind Retail – terms", "Northwind Retail", "Dana", "northwindretail.com", "negotiation", "won", "founder", 104, 80, false),
  call("Harbour Health – discovery", "Harbour Health", "Priya", "harbourhealth.co.uk", "discovery", "won", "founder", 98, 90, false),
  call("Harbour Health – pitch", "Harbour Health", "Priya", "harbourhealth.co.uk", "pitch", "won", "founder", 90, 82, false),
  call("Lumen Fitness – discovery", "Lumen Fitness", "Marco", "lumenfit.com", "discovery", "lost", "founder", 85, 55, true),
  call("Lumen Fitness – pitch", "Lumen Fitness", "Marco", "lumenfit.com", "pitch", "lost", "founder", 80, 50, true),
  call("Atlas Logistics – discovery", "Atlas Logistics", "Hannah", "atlaslogistics.io", "discovery", "won", "founder", 75, 86, false),
  call("Atlas Logistics – quarterly review", "Atlas Logistics", "Hannah", "atlaslogistics.io", "account_review", "won", "founder", 40, 90, true),
  call("Kestrel Foods – pitch", "Kestrel Foods", "Owen", "kestrelfoods.com", "pitch", "open", "founder", 30, 78, false),
  call("Cobalt Finance – terms", "Cobalt Finance", "Ruth", "cobaltfinance.com", "negotiation", "lost", "founder", 25, 72, true),
  call("Meridian Hotels – quarterly review", "Meridian Hotels", "Leo", "meridianhotels.com", "account_review", "won", "founder", 20, 88, true),
];

export const repCalls: CallSeed[] = [
  call("Pine & Co – intro", "Pine & Co", "Ellie", "pineandco.com", "discovery", "open", "rep", 18, 42, true),
  call("Harbour Health – monthly review", "Harbour Health", "Priya", "harbourhealth.co.uk", "account_review", "open", "rep", 15, 44, false),
  call("Vela Studios – discovery", "Vela Studios", "Tom", "velastudios.com", "discovery", "open", "rep", 11, 50, false),
  call("Atlas Logistics – monthly review", "Atlas Logistics", "Hannah", "atlaslogistics.io", "account_review", "open", "rep", 8, 44, false),
  call("Kestrel Foods – follow-up pitch", "Kestrel Foods", "Owen", "kestrelfoods.com", "pitch", "open", "rep", 5, 52, false),
  call("Meridian Hotels – monthly review", "Meridian Hotels", "Leo", "meridianhotels.com", "account_review", "open", "rep", 2, 67, true),
];
