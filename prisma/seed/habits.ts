import type { CallType } from "@prisma/client";

// MVP placeholder framework (spec #1). Stored as seed data so the co-founder's
// framework can replace it without code changes.

const ALL: CallType[] = ["discovery", "pitch", "account_review", "negotiation"];

export const skills = [
  "Opening",
  "Discovery",
  "Listening",
  "Communicating value",
  "Handling objections",
  "Next steps",
  "Spotting opportunities",
  "Reading buyer awareness",
];

export type HabitSeed = {
  code: string;
  skill: string;
  name: string;
  description: string;
  rubric: string;
  appliesTo: CallType[];
  requiresObjection?: boolean;
  computed?: boolean;
};

export const habits: HabitSeed[] = [
  {
    code: "H1",
    skill: "Opening",
    name: "States purpose and time in the first 2 minutes",
    description: "Opens by saying what the call is for and how long it will take.",
    rubric: "Done if, within the first 120 seconds, the rep states the call's purpose and its length or end time.",
    appliesTo: ALL,
  },
  {
    code: "H2",
    skill: "Opening",
    name: "Confirms what the client wants from the call",
    description: "Asks the client what they want to get out of the call.",
    rubric: "Done if the rep asks the client what they want from this call and acknowledges the answer.",
    appliesTo: ALL,
  },
  {
    code: "H3",
    skill: "Discovery",
    name: "Asks 3+ open questions before pitching",
    description: "Understands the client before talking about the agency.",
    rubric: "Done if the rep asks at least three open questions (what/why/how/tell me) before first describing the agency's services.",
    appliesTo: ["discovery", "pitch", "account_review"],
  },
  {
    code: "H4",
    skill: "Discovery",
    name: 'Asks "why now?"',
    description: "Finds out what triggered the client to act at this moment.",
    rubric: "Done if the rep asks what prompted the client to look for help now, or why this is a priority at this time.",
    appliesTo: ["discovery", "pitch"],
  },
  {
    code: "H5",
    skill: "Discovery",
    name: "Summarises back what they heard",
    description: "Plays the client's situation back in their own words.",
    rubric: "Done if the rep summarises the client's situation or needs back to them and checks it's right.",
    appliesTo: ALL,
  },
  {
    code: "H6",
    skill: "Listening",
    name: "Client talks more than half the time",
    description: "Lets the client do most of the talking.",
    rubric: "Computed from the transcript: done if client speaker turns account for more than 50% of talk time.",
    appliesTo: ["discovery", "account_review"],
    computed: true,
  },
  {
    code: "H7",
    skill: "Communicating value",
    name: "Ties each offer to a problem the client raised",
    description: "Every service mentioned is linked to something the client said.",
    rubric: "Done if each service or offer the rep proposes is explicitly linked to a problem or goal the client raised earlier.",
    appliesTo: ["discovery", "pitch"],
  },
  {
    code: "H8",
    skill: "Communicating value",
    name: "Tells one client story with a result",
    description: "Uses a relevant client story with a concrete outcome.",
    rubric: "Done if the rep tells a story about another client that includes a specific, measurable result.",
    appliesTo: ["pitch"],
  },
  {
    code: "H9",
    skill: "Handling objections",
    name: "Acknowledges before answering",
    description: "Shows the objection was heard before responding to it.",
    rubric: "Done if, for the main objection, the rep acknowledges or validates the concern before answering it.",
    appliesTo: ALL,
    requiresObjection: true,
  },
  {
    code: "H10",
    skill: "Handling objections",
    name: "Asks a question to understand the objection",
    description: "Digs into the objection before answering it.",
    rubric: "Done if the rep asks at least one question to understand the objection before answering it.",
    appliesTo: ALL,
    requiresObjection: true,
  },
  {
    code: "H11",
    skill: "Next steps",
    name: "Ends with a dated next step",
    description: "Leaves the call with an agreed action and a date.",
    rubric: "Done if the call ends with an agreed next step that has a specific date or day.",
    appliesTo: ALL,
  },
  {
    code: "H12",
    skill: "Next steps",
    name: "Confirms who else is involved in the decision",
    description: "Finds out who else needs to say yes.",
    rubric: "Done if the rep asks who else is involved in the decision or approval.",
    appliesTo: ["discovery", "pitch", "negotiation"],
  },
  {
    code: "H13",
    skill: "Spotting opportunities",
    name: "Asks about next-quarter priorities",
    description: "Looks ahead for the client's next priorities.",
    rubric: "Done if the rep asks about the client's priorities or plans for the next quarter or next period.",
    appliesTo: ["account_review"],
  },
  {
    code: "H14",
    skill: "Reading buyer awareness",
    name: "Matches the message to the client's awareness level",
    description: "Pitches only once the client is ready for it.",
    rubric: "Done if the rep's approach fits the client's awareness level, e.g. no service pitch before the problem is established for unaware or problem-aware clients.",
    appliesTo: ["discovery", "pitch"],
  },
];

/** Account manager habit path order. */
export const accountManagerPath = ["H6", "H13", "H5", "H11", "H9", "H10", "H2", "H1", "H3", "H7", "H14", "H4", "H12", "H8"];
