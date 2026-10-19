import Link from "next/link";
import { saveFathomKey } from "@/app/actions/fathom";
import { FathomKeyForm } from "@/components/fathom/key-form";
import { OnboardingFrame } from "@/components/onboarding-frame";
import { buttonVariants } from "@/components/ui/button";
import { resolveFathomKey } from "@/lib/fathom/key";
import { requireCurrentUser } from "@/lib/session";

export const metadata = { title: "Connect Fathom · Founder²" };

export default async function ConnectFathomPage({ searchParams }: PageProps<"/onboarding/fathom">) {
  const user = await requireCurrentUser();
  const { error } = await searchParams;
  const connected = resolveFathomKey(user);

  return (
    <OnboardingFrame
      step="Step 2"
      title="Connect Fathom"
      description="Founder² learns from your recorded calls. Paste a personal Fathom API key; you'll choose exactly which calls to import."
    >
      <div className="flex flex-col gap-6">
        {connected && (
          <div className="flex flex-col gap-2 rounded-lg border p-4 text-sm">
            <p>
              Fathom is already connected{connected.source === "default" ? " for this deployment" : ""}. You can continue, or paste a different key below.
            </p>
            <Link href="/onboarding/context" className={buttonVariants({ className: "self-start" })}>
              Continue
            </Link>
          </div>
        )}
        <FathomKeyForm action={saveFathomKey.bind(null, "onboarding")} error={typeof error === "string" ? error : undefined} />
        <Link href="/onboarding/upload" className="text-sm text-muted-foreground underline underline-offset-4">
          I&apos;ll upload recordings instead
        </Link>
      </div>
    </OnboardingFrame>
  );
}
