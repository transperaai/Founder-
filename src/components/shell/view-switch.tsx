import type { View } from "@prisma/client";
import { switchView } from "@/app/actions/view";
import { cn } from "@/lib/utils";

const views: { view: View; label: string }[] = [
  { view: "founder", label: "Founder view" },
  { view: "rep", label: "Rep view" },
];

export function ViewSwitch({ current }: { current: View }) {
  return (
    <div role="group" aria-label="Switch view" className="inline-flex rounded-lg border bg-muted p-0.5">
      {views.map(({ view, label }) => (
        <form key={view} action={switchView.bind(null, view)}>
          <button
            type="submit"
            aria-pressed={current === view}
            className={cn(
              "rounded-md px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground",
              current === view && "bg-background font-medium text-foreground shadow-sm",
            )}
          >
            {label}
          </button>
        </form>
      ))}
    </div>
  );
}
