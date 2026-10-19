import Link from "next/link";
import { redirect } from "next/navigation";
import { approveProfile } from "@/app/actions/business-context";
import { ProfileEditor } from "@/components/business-context/profile-editor";
import { OnboardingFrame } from "@/components/onboarding-frame";
import type { BusinessProfile } from "@/lib/business-context";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";

export const metadata = { title: "Your profile · Founder²" };

export default async function OnboardingProfilePage({ searchParams }: PageProps<"/onboarding/profile">) {
  await requireCurrentUser();
  const latest = await db.businessContext.findFirst({ orderBy: { version: "desc" } });
  if (!latest) redirect("/onboarding/business");
  const { error } = await searchParams;

  return (
    <OnboardingFrame
      step="Step 5"
      title="Your business profile"
      description="This is what reps and the call analysis will know about your agency. Edit anything that's off, then approve."
    >
      <div className="flex flex-col gap-4">
        <ProfileEditor
          action={approveProfile.bind(null, "onboarding")}
          profile={latest.profileSummary as BusinessProfile | null}
          version={latest.version}
          approvedAt={latest.approvedAt}
          error={typeof error === "string" ? error : undefined}
          submitLabel="Approve and continue"
        />
        <Link href="/onboarding/business" className="text-sm text-muted-foreground underline underline-offset-4">
          Change my answers
        </Link>
      </div>
    </OnboardingFrame>
  );
}
