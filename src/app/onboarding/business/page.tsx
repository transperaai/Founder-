import { submitAnswers } from "@/app/actions/business-context";
import { QuestionsForm } from "@/components/business-context/questions-form";
import { OnboardingFrame } from "@/components/onboarding-frame";
import type { BusinessAnswers } from "@/lib/business-context";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";

export const metadata = { title: "Five questions · Founder²" };

export default async function BusinessQuestionsPage() {
  await requireCurrentUser();
  const latest = await db.businessContext.findFirst({ orderBy: { version: "desc" } });
  return (
    <OnboardingFrame
      step="Step 4"
      title="Tell us about your business"
      description="A few sentences each is plenty. We'll turn this into a profile you can edit."
    >
      <QuestionsForm action={submitAnswers.bind(null, "onboarding")} defaults={latest?.answers as Partial<BusinessAnswers> | undefined} />
    </OnboardingFrame>
  );
}
