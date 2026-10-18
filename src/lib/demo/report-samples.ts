// Sample numbers for the 30/90-day impact report (spec step 29). Shown with a
// "Sample data" label wherever real data doesn't exist yet.

export type ReportPeriod = 30 | 90;

export const reportSamples: Record<
  ReportPeriod,
  {
    habitsMadeConsistent: { code: string; name: string }[];
    scoreVsBaseline: { callType: string; baseline: number; current: number }[];
    opportunities: { raised: number; won: number; winRate: number };
    deals: { closed: number; valueWon: number };
  }
> = {
  30: {
    habitsMadeConsistent: [{ code: "H5", name: "Summarises back what they heard" }],
    scoreVsBaseline: [
      { callType: "discovery", baseline: 46, current: 54 },
      { callType: "pitch", baseline: 50, current: 58 },
      { callType: "account_review", baseline: 44, current: 61 },
    ],
    opportunities: { raised: 6, won: 1, winRate: 17 },
    deals: { closed: 1, valueWon: 12500 },
  },
  90: {
    habitsMadeConsistent: [
      { code: "H5", name: "Summarises back what they heard" },
      { code: "H13", name: "Asks about next-quarter priorities" },
      { code: "H11", name: "Ends with a dated next step" },
    ],
    scoreVsBaseline: [
      { callType: "discovery", baseline: 46, current: 63 },
      { callType: "pitch", baseline: 50, current: 66 },
      { callType: "account_review", baseline: 44, current: 72 },
    ],
    opportunities: { raised: 17, won: 5, winRate: 29 },
    deals: { closed: 4, valueWon: 86000 },
  },
};
