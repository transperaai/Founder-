import { Badge } from "@/components/ui/badge";
import type { FathomKeySource } from "@/lib/fathom/key";

export function FathomConnectionStatus({ source }: { source: FathomKeySource | null }) {
  return (
    <p className="flex items-center gap-2 text-sm">
      Fathom
      <Badge variant={source ? "secondary" : "outline"}>{source ? "Connected" : "Not connected"}</Badge>
      {source === "default" && <span className="text-muted-foreground">using this deployment&apos;s default key</span>}
      {source === "saved" && <span className="text-muted-foreground">using the key you saved</span>}
    </p>
  );
}
