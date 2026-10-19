import Link from "next/link";
import { removeFathomKey, saveFathomKey, useDefaultFathomKey } from "@/app/actions/fathom";
import { FathomConnectionStatus } from "@/components/fathom/connection-status";
import { FathomKeyForm } from "@/components/fathom/key-form";
import { PageHeader } from "@/components/placeholders";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveFathomKey } from "@/lib/fathom/key";
import { requireCurrentUser } from "@/lib/session";

export const metadata = { title: "Connect Fathom · Founder²" };

export default async function FathomSettingsPage({ searchParams }: PageProps<"/founder/settings/fathom">) {
  const user = await requireCurrentUser();
  const { error, saved, removed } = await searchParams;
  const source = resolveFathomKey(user)?.source ?? null;
  const hasDefault = Boolean(process.env.FATHOM_API_KEY);

  return (
    <>
      <PageHeader title="Connect Fathom" description="Founder² reads your Fathom meetings with a personal API key." />
      <div className="flex max-w-xl flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Connection</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FathomConnectionStatus source={source} />
            {saved && <p className="text-sm text-muted-foreground">Saved.</p>}
            {removed && <p className="text-sm text-muted-foreground">Fathom disconnected.</p>}
            {source && (
              <div className="flex flex-wrap gap-2">
                <Link href="/founder/calls/import" className="text-sm font-medium underline underline-offset-4">
                  Import calls from Fathom
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{source ? "Replace the key" : "Add your key"}</CardTitle>
          </CardHeader>
          <CardContent>
            <FathomKeyForm
              action={saveFathomKey.bind(null, "settings")}
              error={typeof error === "string" ? error : undefined}
              submitLabel={source ? "Replace key" : "Connect Fathom"}
            />
          </CardContent>
        </Card>
        <div className="flex flex-wrap gap-2">
          {source && (
            <form action={removeFathomKey}>
              <SubmitButton variant="outline">Disconnect Fathom</SubmitButton>
            </form>
          )}
          {hasDefault && source !== "default" && (
            <form action={useDefaultFathomKey}>
              <SubmitButton variant="ghost">Use the deployment&apos;s default key</SubmitButton>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
