import Link from "next/link";
import { ComingSoon, PageHeader } from "@/components/placeholders";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { RECOMMENDED_CALLS, callTypeLabel, coverage } from "@/lib/coverage";

export const metadata = { title: "Coverage check · Founder²" };

export default async function CoveragePage() {
  const calls = await db.call.findMany({ where: { role: "founder" }, select: { callType: true } });
  const { total, byType } = coverage(calls);
  const pct = Math.min(100, Math.round((total / RECOMMENDED_CALLS.min) * 100));

  return (
    <>
      <PageHeader title="Coverage check" description="Is there enough of your selling on record to learn from?" />
      <ComingSoon
        title="Coverage check"
        explainer="In the full version, Founder² checks whether your calls cover every stage of a deal and asks you short gap-filling questions where they don't. The counts below are real; the guidance is a preview."
      >
        <div className="flex flex-col gap-6">
          <div>
            <div className="mb-2 flex items-baseline justify-between text-sm">
              <span className="font-medium">
                {total} founder calls
              </span>
              <span className="text-muted-foreground">
                Recommended: {RECOMMENDED_CALLS.min}–{RECOMMENDED_CALLS.max}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Calls against recommendation">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {byType.map(({ type, count, thin }) => (
              <li key={type} className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">{callTypeLabel[type]}</p>
                <p className="text-2xl font-semibold">{count}</p>
                {thin && <Badge variant="outline">Thin</Badge>}
              </li>
            ))}
          </ul>
          <Link href="/founder/coverage/questionnaire" className="text-sm font-medium underline underline-offset-4">
            Fill the gaps with a short questionnaire
          </Link>
        </div>
      </ComingSoon>
    </>
  );
}
