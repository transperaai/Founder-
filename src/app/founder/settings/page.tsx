import Link from "next/link";
import { FathomConnectionStatus } from "@/components/fathom/connection-status";
import { PageHeader } from "@/components/placeholders";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveFathomKey } from "@/lib/fathom/key";
import { requireCurrentUser } from "@/lib/session";

export const metadata = { title: "Settings · Founder²" };

const providerLabel: Record<string, string> = { google: "Google", "microsoft-entra-id": "Microsoft", demo: "Demo" };

export default async function SettingsPage() {
  const user = await requireCurrentUser();
  return (
    <>
      <PageHeader title="Settings" description="Your account and integrations." />
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <p>
              {user.name} · {user.email}
              {user.authProvider && <span className="text-muted-foreground"> · {providerLabel[user.authProvider] ?? user.authProvider}</span>}
            </p>
            <p className="flex items-center gap-2">
              Calendar access
              <Badge variant={user.calendarAccessGranted ? "secondary" : "outline"}>
                {user.calendarAccessGranted ? "Granted" : "Not granted"}
              </Badge>
            </p>
            {!user.calendarAccessGranted && (
              <p className="text-muted-foreground">Pre-call briefs are hidden. Sign out and sign in again to grant calendar access.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Business context</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <Link href="/founder/settings/business-context" className="underline underline-offset-4">
              View and edit your business profile
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Fathom</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <FathomConnectionStatus source={resolveFathomKey(user)?.source ?? null} />
            <Link href="/founder/settings/fathom" className="underline underline-offset-4">
              Manage your Fathom connection
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
