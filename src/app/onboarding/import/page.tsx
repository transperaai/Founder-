import { redirect } from "next/navigation";
import { finishOnboardingImport, listFathomMeetings } from "@/app/actions/fathom";
import { ImportProgress } from "@/components/fathom/import-progress";
import { MeetingPicker } from "@/components/fathom/meeting-picker";
import { OnboardingFrame } from "@/components/onboarding-frame";
import { SubmitButton } from "@/components/submit-button";
import { RECOMMENDED_CALLS } from "@/lib/coverage";
import { resolveFathomKey } from "@/lib/fathom/key";
import { requireCurrentUser } from "@/lib/session";

export const metadata = { title: "Import calls · Founder²" };

export default async function OnboardingImportPage() {
  const user = await requireCurrentUser();
  if (!resolveFathomKey(user)) redirect("/onboarding/fathom");

  return (
    <OnboardingFrame
      step="Step 6"
      title="Import your calls"
      description={`Pick ${RECOMMENDED_CALLS.min}–${RECOMMENDED_CALLS.max} calls where you sold well, or lost and learned. Only the calls you tick are imported, in the background.`}
    >
      <div className="flex flex-col gap-6">
        <MeetingPicker initial={await listFathomMeetings()} />
        <ImportProgress />
        <form action={finishOnboardingImport} className="flex flex-col gap-2">
          <SubmitButton>Continue to tagging</SubmitButton>
          <p className="text-xs text-muted-foreground">Imports keep running while you tag. You can import more from Calls at any time.</p>
        </form>
      </div>
    </OnboardingFrame>
  );
}
