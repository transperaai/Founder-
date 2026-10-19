import { submitAnswers } from "@/app/actions/business-context";
import { QuestionsForm } from "@/components/business-context/questions-form";
import { PageHeader } from "@/components/placeholders";
import { Card, CardContent } from "@/components/ui/card";
import type { BusinessAnswers } from "@/lib/business-context";
import { db } from "@/lib/db";

export const metadata = { title: "Business questions · Founder²" };

export default async function SettingsQuestionsPage() {
  const latest = await db.businessContext.findFirst({ orderBy: { version: "desc" } });
  return (
    <>
      <PageHeader title="Business questions" description="Your answers create a new profile version for you to review." />
      <Card>
        <CardContent className="pt-6">
          <QuestionsForm action={submitAnswers.bind(null, "settings")} defaults={latest?.answers as Partial<BusinessAnswers> | undefined} />
        </CardContent>
      </Card>
    </>
  );
}
