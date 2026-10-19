import Link from "next/link";
import { OnboardingFrame } from "@/components/onboarding-frame";
import { ComingSoon } from "@/components/placeholders";
import { buttonVariants } from "@/components/ui/button";
import { requireCurrentUser } from "@/lib/session";

export const metadata = { title: "Your business · Founder²" };

export default async function ContextExtractionPage() {
  await requireCurrentUser();
  return (
    <OnboardingFrame step="Step 3" title="Your business">
      <div className="flex flex-col gap-6">
        <ComingSoon
          title="Business context extraction"
          explainer="In the full version, we'll capture your agency's positioning, ideal clients, offer and sales process in depth: through a guided session, a conversation with our team, or AI working from your website and documents. For now, five quick questions do the job."
        />
        <Link href="/onboarding/business" className={buttonVariants()}>
          Answer five questions
        </Link>
      </div>
    </OnboardingFrame>
  );
}
