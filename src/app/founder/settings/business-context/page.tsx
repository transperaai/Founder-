import Link from "next/link";
import { approveProfile } from "@/app/actions/business-context";
import { ProfileEditor } from "@/components/business-context/profile-editor";
import { PageHeader } from "@/components/placeholders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BusinessProfile } from "@/lib/business-context";
import { db } from "@/lib/db";

export const metadata = { title: "Business context · Founder²" };

export default async function BusinessContextSettingsPage({ searchParams }: PageProps<"/founder/settings/business-context">) {
  const versions = await db.businessContext.findMany({ orderBy: { version: "desc" } });
  const latest = versions[0];
  const { error, saved } = await searchParams;

  return (
    <>
      <PageHeader title="Business context" description="What reps and the call analysis know about your agency." />
      {!latest ? (
        <Link href="/founder/settings/business-context/questions" className="text-sm font-medium underline underline-offset-4">
          Answer the five questions
        </Link>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
          <Card>
            <CardContent className="pt-6">
              {saved && <p className="mb-4 text-sm text-muted-foreground">Saved.</p>}
              <ProfileEditor
                action={approveProfile.bind(null, "settings")}
                profile={latest.profileSummary as BusinessProfile | null}
                version={latest.version}
                approvedAt={latest.approvedAt}
                error={typeof error === "string" ? error : undefined}
                submitLabel={latest.approvedAt ? "Save changes" : "Approve profile"}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">History</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <ul className="flex flex-col gap-1 text-muted-foreground">
                {versions.map((v) => (
                  <li key={v.id}>
                    v{v.version} · {v.approvedAt ? `approved ${v.approvedAt.toLocaleDateString("en-GB")}` : "draft"}
                  </li>
                ))}
              </ul>
              <Link href="/founder/settings/business-context/questions" className="underline underline-offset-4">
                Answer the questions again
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
