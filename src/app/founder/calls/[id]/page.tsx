import type { AwarenessLevel, MomentType } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/calls/status-badge";
import { MomentPlayer, PlayMoment } from "@/components/calls/moment-player";
import { PageHeader } from "@/components/placeholders";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { callTypeLabel, formatDuration, outcomeLabel, roleLabel } from "@/lib/calls/labels";
import { db } from "@/lib/db";
import type { HabitResult } from "@/lib/scoring";

export const metadata = { title: "Call · Founder²" };

const momentLabel: Record<MomentType, string> = {
  opening: "Opening",
  discovery_question: "Discovery question",
  client_need: "Client need",
  objection: "Objection",
  pricing: "Pricing",
  value_story: "Value story",
  buying_signal: "Buying signal",
  decision: "Decision",
  next_steps: "Next steps",
  small_talk: "Small talk",
};

const awarenessLabel: Record<AwarenessLevel, string> = {
  unaware: "Unaware",
  problem_aware: "Problem aware",
  solution_aware: "Solution aware",
  product_aware: "Product aware",
  most_aware: "Most aware",
};

export default async function CallPage({ params }: PageProps<"/founder/calls/[id]">) {
  const { id } = await params;
  const call = await db.call.findUnique({ where: { id }, include: { moments: { orderBy: { startS: "asc" } }, scorecard: true } });
  if (!call) notFound();

  const habits = await db.habit.findMany({ select: { code: true, name: true } });
  const habitName = new Map(habits.map((h) => [h.code, h.name]));
  const moments = new Map(call.moments.map((m) => [m.id, m]));
  const results = (call.scorecard?.habitResults ?? []) as HabitResult[];

  return (
    <>
      <PageHeader
        title={call.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {call.startedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {formatDuration(call.durationS)} ·{" "}
            {call.callType ? callTypeLabel[call.callType] : "Not classified"} · {roleLabel[call.role]} call · {outcomeLabel[call.outcome]}
            <StatusBadge status={call.status} />
          </span>
        }
      />
      <MomentPlayer src={call.mediaUrl}>
        <div className="mt-6 flex flex-col gap-6">
          {call.scorecard ? (
            <Card>
              <CardHeader>
                <CardTitle>Scorecard</CardTitle>
                <CardDescription>Each habit that applies to this call type, judged against its rubric.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <dt className="text-sm text-muted-foreground">Score</dt>
                    <dd className="text-3xl font-semibold tabular-nums">{call.scorecard.total}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Founder benchmark</dt>
                    <dd className="text-3xl font-semibold tabular-nums">{call.scorecard.benchmarkTotal ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Buyer awareness</dt>
                    <dd className="text-sm font-medium">{call.scorecard.awarenessLevel ? awarenessLabel[call.scorecard.awarenessLevel] : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Approach matched it</dt>
                    <dd className="text-sm font-medium">{call.scorecard.awarenessMatched == null ? "—" : call.scorecard.awarenessMatched ? "Yes" : "No"}</dd>
                  </div>
                </dl>
                <ul aria-label="Habits" className="flex flex-col divide-y">
                  {results.map((r) => {
                    const evidence = r.evidenceMomentId ? moments.get(r.evidenceMomentId) : undefined;
                    return (
                      <li key={r.habitCode} className="flex flex-wrap items-start justify-between gap-3 py-3">
                        <div className="flex max-w-prose flex-col gap-1">
                          <p className="text-sm font-medium">
                            {r.habitCode} · {habitName.get(r.habitCode) ?? "Unknown habit"}
                          </p>
                          <p className="text-sm text-muted-foreground">{r.note === "not_observed" ? "Not observed on this call." : r.note}</p>
                          {evidence && (
                            <p className="text-xs text-muted-foreground">
                              Evidence: {momentLabel[evidence.type]}, {evidence.summary}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {evidence && <PlayMoment startS={evidence.startS} endS={evidence.endS} label={`${r.habitCode} evidence`} />}
                          <Badge variant={r.done ? "secondary" : "outline"}>{r.done ? "Done" : "Not done"}</Badge>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ) : (
            <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              {call.status === "skipped" ? "Internal calls aren't scored." : "No scorecard yet. It appears once analysis finishes."}
            </p>
          )}
          {call.moments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Moments</CardTitle>
              </CardHeader>
              <CardContent>
                <ul aria-label="Moments" className="flex flex-col divide-y">
                  {call.moments.map((m) => (
                    <li key={m.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                      <span>
                        <span className="font-medium">{momentLabel[m.type]}</span> · {m.speaker}: {m.summary}
                      </span>
                      <PlayMoment startS={m.startS} endS={m.endS} label={momentLabel[m.type]} />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          <Link href="/founder/calls" className="text-sm font-medium underline underline-offset-4">
            Back to calls
          </Link>
        </div>
      </MomentPlayer>
    </>
  );
}
