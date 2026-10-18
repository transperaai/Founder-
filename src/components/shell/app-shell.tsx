import type { View } from "@prisma/client";
import { navFor } from "@/lib/nav";
import { requireCurrentUser } from "@/lib/session";
import { NavLinks } from "./nav-links";
import { ViewSwitch } from "./view-switch";

/** Layout for every signed-in screen. `view` is the view this route belongs to. */
export async function AppShell({ view, children }: { view: View; children: React.ReactNode }) {
  const user = await requireCurrentUser();
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r bg-sidebar px-3 py-4 md:block">
        <div className="mb-6 px-3 text-lg font-semibold tracking-tight">
          Founder<sup>2</sup>
        </div>
        <NavLinks items={navFor(view)} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-4 border-b px-6">
          <span className="text-sm font-semibold md:hidden">
            Founder<sup>2</sup>
          </span>
          <ViewSwitch current={view} />
          <span className="text-sm text-muted-foreground">{user.name}</span>
        </header>
        <div className="border-b px-3 py-2 md:hidden">
          <NavLinks items={navFor(view)} />
        </div>
        <main className="flex-1 px-6 py-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
