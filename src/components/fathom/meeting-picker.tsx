"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { importFathomMeetings, listFathomMeetings, type MeetingPage } from "@/app/actions/fathom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDuration } from "@/lib/calls/labels";

/**
 * The founder's Fathom meetings, a page at a time. Only ticked meetings are
 * imported; already-imported ones are marked and can't be ticked.
 */
export function MeetingPicker({ initial }: { initial: MeetingPage }) {
  const router = useRouter();
  const [meetings, setMeetings] = useState(initial.meetings);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [error, setError] = useState(initial.error);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, startLoading] = useTransition();
  const [importing, startImport] = useTransition();

  const selectable = meetings.filter((m) => !m.imported);
  const allSelected = selectable.length > 0 && selectable.every((m) => selected.has(m.recordingId));
  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const loadMore = () =>
    startLoading(async () => {
      const page = await listFathomMeetings(cursor ?? undefined);
      setError(page.error);
      if (page.error) return;
      setMeetings((m) => [...m, ...page.meetings.filter((n) => !m.some((x) => x.recordingId === n.recordingId))]);
      setCursor(page.nextCursor);
    });

  const importSelected = () =>
    startImport(async () => {
      const chosen = meetings.filter((m) => selected.has(m.recordingId));
      try {
        const { imported } = await importFathomMeetings(chosen);
        toast.success(`Importing ${imported} call${imported === 1 ? "" : "s"}.`);
        setMeetings((all) => all.map((m) => (selected.has(m.recordingId) ? { ...m, imported: true } : m)));
        setSelected(new Set());
        router.refresh();
      } catch {
        toast.error("The import didn't start. Try again.");
      }
    });

  if (error && meetings.length === 0) {
    return (
      <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    );
  }
  if (meetings.length === 0) {
    return <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">No meetings in Fathom yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">
              <input
                type="checkbox"
                aria-label="Select all"
                className="size-4 align-middle"
                checked={allSelected}
                disabled={selectable.length === 0}
                onChange={() => setSelected(allSelected ? new Set() : new Set(selectable.map((m) => m.recordingId)))}
              />
            </TableHead>
            <TableHead>Meeting</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {meetings.map((m) => (
            <TableRow key={m.recordingId} data-state={selected.has(m.recordingId) ? "selected" : undefined}>
              <TableCell>
                <input
                  type="checkbox"
                  aria-label={`Select ${m.title}`}
                  className="size-4 align-middle"
                  checked={m.imported || selected.has(m.recordingId)}
                  disabled={m.imported}
                  onChange={() => toggle(m.recordingId)}
                />
              </TableCell>
              <TableCell className="font-medium">
                {m.title} {m.imported && <Badge variant="secondary">Imported</Badge>}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(m.startedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDuration(m.durationS)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={importSelected} disabled={selected.size === 0 || importing}>
          {importing ? "Starting import…" : `Import ${selected.size} selected`}
        </Button>
        {cursor && (
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? "Loading…" : "Load more meetings"}
          </Button>
        )}
        <span className="text-sm text-muted-foreground">Only the meetings you tick are imported.</span>
      </div>
    </div>
  );
}
