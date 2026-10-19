import Link from "next/link";
import { OnboardingFrame } from "@/components/onboarding-frame";
import { UnderConstruction } from "@/components/placeholders";
import { buttonVariants } from "@/components/ui/button";
import { requireCurrentUser } from "@/lib/session";

export const metadata = { title: "Upload transcripts · Founder²" };

export default async function UploadPage() {
  await requireCurrentUser();
  return (
    <OnboardingFrame step="Step 2" title="Upload transcripts" description="Upload .txt, .vtt or .srt transcripts of your calls instead of connecting Fathom.">
      <div className="flex flex-col gap-6">
        <UnderConstruction issue={7} />
        <Link href="/onboarding/context" className={buttonVariants()}>
          Continue
        </Link>
        <Link href="/onboarding/fathom" className="text-sm text-muted-foreground underline underline-offset-4">
          Connect Fathom instead
        </Link>
      </div>
    </OnboardingFrame>
  );
}
