import Link from "next/link";
import { redirect } from "next/navigation";
import { completeOnboarding } from "@/app/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/session";

export const metadata = { title: "Get started · Founder²" };

const steps = [
  { title: "Tell us about your business", detail: "Five quick questions, turned into a profile you approve." },
  { title: "Connect Fathom", detail: "Paste your Fathom API key, or upload transcripts instead." },
  { title: "Import and tag your calls", detail: "Pick 10–20 calls; tag type, outcome and who led them." },
  { title: "Build your playbook", detail: "We extract how you sell, filtered for quality." },
];

export default async function OnboardingPage() {
  const user = await requireCurrentUser();
  if (user.onboardedAt) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-xl">Welcome, {user.name.split(" ")[0]}</CardTitle>
          <CardDescription>Four steps to a playbook your reps can learn from.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <ol className="flex flex-col gap-3">
            {steps.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">{i + 1}</span>
                <div>
                  <p className="text-sm font-medium">
                    {step.title} {i === 0 && <Badge variant="secondary">Next</Badge>}
                  </p>
                  <p className="text-sm text-muted-foreground">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
          {!user.calendarAccessGranted && (
            <p className="text-sm text-muted-foreground">
              Calendar access wasn&apos;t granted, so pre-call briefs are hidden. You can sign in again to grant it.
            </p>
          )}
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Connecting Fathom is being built (GitHub issue #6), so setup starts with your business for now.
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/onboarding/context" className={buttonVariants()}>
              Start with your business
            </Link>
            <form action={completeOnboarding}>
              <Button type="submit" variant="ghost" className="w-full">
                Skip setup for now
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
