import { AutoRefresh } from "@/components/auto-refresh";
import { StatusBadge } from "@/components/calls/status-badge";
import { PageHeader } from "@/components/placeholders";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { callTypeLabel, formatDuration } from "@/lib/calls/labels";

export const metadata = { title: "My calls · Founder²" };

export default async function Page() {
  const calls = await db.call.findMany({
    where: { role: "rep" },
    orderBy: { startedAt: "desc" },
    select: { id: true, title: true, startedAt: true, durationS: true, status: true, callType: true, scorecard: { select: { total: true } } },
  });
  const inProgress = calls.some((c) => c.status === "importing" || c.status === "analysing");

  return (
    <>
      <PageHeader title="My calls" description="Your analysed calls and feedback." />
      <AutoRefresh active={inProgress} />
      {calls.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          No calls yet. New calls appear here, analysed, once Fathom finishes processing them.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Call type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.map((call) => (
              <TableRow key={call.id}>
                <TableCell className="font-medium">{call.title}</TableCell>
                <TableCell className="text-muted-foreground">
                  {call.startedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDuration(call.durationS)}</TableCell>
                <TableCell>{call.callType ? callTypeLabel[call.callType] : "—"}</TableCell>
                <TableCell>
                  <StatusBadge status={call.status} />
                </TableCell>
                <TableCell className="text-right tabular-nums">{call.scorecard?.total ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
