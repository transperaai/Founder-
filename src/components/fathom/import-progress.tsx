import { AutoRefresh } from "@/components/auto-refresh";
import { StatusBadge } from "@/components/calls/status-badge";
import { db } from "@/lib/db";

/** Per-call status of Fathom imports, refreshing while any is in flight. */
export async function ImportProgress() {
  const calls = await db.call.findMany({
    where: { source: "fathom", status: { in: ["importing", "analysing", "error"] } },
    orderBy: { startedAt: "desc" },
    select: { id: true, title: true, status: true, errorMessage: true },
  });
  if (calls.length === 0) return null;
  return (
    <section aria-label="Import progress" className="flex flex-col gap-2">
      <AutoRefresh active={calls.some((c) => c.status !== "error")} />
      <h2 className="text-sm font-medium">In progress</h2>
      <ul className="flex flex-col gap-1 text-sm">
        {calls.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
            <span className="truncate">{c.title}</span>
            <span className="flex items-center gap-2">
              {c.status === "error" && <span className="text-xs text-destructive">{c.errorMessage}</span>}
              <StatusBadge status={c.status} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
