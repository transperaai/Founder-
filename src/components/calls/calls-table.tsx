"use client";

import type { CallOutcome, CallRole, CallSource, CallStatus, CallType } from "@prisma/client";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteCall, retryCall, setCallTag } from "@/app/actions/calls";
import { StatusBadge } from "@/components/calls/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { callTypeLabel, formatDuration, outcomeLabel, roleLabel, sourceLabel } from "@/lib/calls/labels";

export type CallRow = {
  id: string;
  title: string;
  startedAt: string;
  durationS: number;
  source: CallSource;
  status: CallStatus;
  errorMessage: string | null;
  callType: CallType | null;
  outcome: CallOutcome;
  role: CallRole;
};

const selectClass =
  "h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

function TagSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  value: T | null;
  options: Record<T, string>;
  onChange: (value: T) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <select aria-label={label} className={selectClass} value={value ?? ""} disabled={disabled} onChange={(e) => onChange(e.target.value as T)}>
      {value === null && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {(Object.entries(options) as [T, string][]).map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

function CallRowView({ call }: { call: CallRow }) {
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<void>, done?: string) =>
    startTransition(async () => {
      try {
        await action();
        if (done) toast.success(done);
      } catch {
        toast.error("That didn't save. Try again.");
      }
    });
  const busy = pending || call.status === "analysing" || call.status === "importing";

  return (
    <TableRow data-call-id={call.id} aria-busy={pending}>
      <TableCell className="max-w-64 truncate font-medium" title={call.title}>
        <Link href={`/founder/calls/${call.id}`} className="hover:underline">
          {call.title}
        </Link>
      </TableCell>
      <TableCell className="text-muted-foreground">{new Date(call.startedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</TableCell>
      <TableCell className="text-muted-foreground">{formatDuration(call.durationS)}</TableCell>
      <TableCell className="text-muted-foreground">{sourceLabel[call.source]}</TableCell>
      <TableCell>
        <div className="flex flex-col items-start gap-1">
          <StatusBadge status={call.status} />
          {call.status === "error" && (
            <>
              {call.errorMessage && <span className="max-w-56 text-xs whitespace-normal text-destructive">{call.errorMessage}</span>}
              <Button size="xs" variant="outline" disabled={pending} onClick={() => run(() => retryCall(call.id))}>
                Retry
              </Button>
            </>
          )}
        </div>
      </TableCell>
      <TableCell>
        <TagSelect
          label="Call type"
          value={call.callType}
          options={callTypeLabel}
          placeholder="Not classified"
          disabled={busy}
          onChange={(v) => run(() => setCallTag(call.id, "callType", v), "Call type saved. Re-analysing.")}
        />
      </TableCell>
      <TableCell>
        <TagSelect label="Outcome" value={call.outcome} options={outcomeLabel} disabled={pending} onChange={(v) => run(() => setCallTag(call.id, "outcome", v))} />
      </TableCell>
      <TableCell>
        <TagSelect label="Role" value={call.role} options={roleLabel} disabled={pending} onChange={(v) => run(() => setCallTag(call.id, "role", v))} />
      </TableCell>
      <TableCell>
        <Dialog>
          <DialogTrigger render={<Button size="xs" variant="ghost" />}>Delete</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this call?</DialogTitle>
              <DialogDescription>
                &ldquo;{call.title}&rdquo; and its recording, moments, scorecard, feedback and comparisons will be deleted. Playbook items lose it as a
                source. This can&apos;t be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
              <Button variant="destructive" disabled={pending} onClick={() => run(() => deleteCall(call.id), "Call deleted.")}>
                Delete call
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TableCell>
    </TableRow>
  );
}

/** The founder's calls table: inline tagging, status with Retry, and delete. */
export function CallsTable({ calls }: { calls: CallRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Call type</TableHead>
          <TableHead>Outcome</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {calls.map((call) => (
          <CallRowView key={call.id} call={call} />
        ))}
      </TableBody>
    </Table>
  );
}
