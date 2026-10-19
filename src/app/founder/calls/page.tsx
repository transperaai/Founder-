import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { CallsTable } from "@/components/calls/calls-table";
import { PageHeader } from "@/components/placeholders";
import { db } from "@/lib/db";

export const metadata = { title: "Calls · Founder²" };

export default async function Page() {
  const calls = await db.call.findMany({
    orderBy: { startedAt: "desc" },
    select: {
      id: true, title: true, startedAt: true, durationS: true, source: true, status: true,
      errorMessage: true, callType: true, outcome: true, role: true,
    },
  });
  const inProgress = calls.some((c) => c.status === "importing" || c.status === "analysing");

  return (
    <>
      <PageHeader title="Calls" description="Every imported call, its tags and analysis status." />
      <AutoRefresh active={inProgress} />
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Tag each call&apos;s type, outcome and who led it. In the full version this will be automated.
          </p>
          <Link href="/founder/coverage" className="text-sm font-medium underline underline-offset-4">
            Check coverage
          </Link>
        </div>
        {calls.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">No calls yet. Connect Fathom or upload transcripts to import some.</p>
        ) : (
          <CallsTable calls={calls.map((c) => ({ ...c, startedAt: c.startedAt.toISOString() }))} />
        )}
      </div>
    </>
  );
}
