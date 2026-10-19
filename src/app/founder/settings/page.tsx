import { PageHeader, UnderConstruction } from "@/components/placeholders";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <UnderConstruction issue={6} />
      </div>
    </>
  );
}
