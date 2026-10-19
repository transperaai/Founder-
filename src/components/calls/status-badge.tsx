import type { CallStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { statusLabel } from "@/lib/calls/labels";

const variant: Record<CallStatus, "default" | "secondary" | "outline" | "destructive"> = {
  importing: "outline",
  analysing: "outline",
  ready: "secondary",
  skipped: "outline",
  error: "destructive",
};

export function StatusBadge({ status }: { status: CallStatus }) {
  return <Badge variant={variant[status]}>{statusLabel[status]}</Badge>;
}
