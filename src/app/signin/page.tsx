import { redirect } from "next/navigation";
import { signInWith } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { configuredProviders } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Sign in · Founder²" };

const errors: Record<string, string> = {
  AccessDenied: "This Founder² workspace belongs to another account. Ask the founder to add your email.",
  Configuration: "Sign-in isn't configured correctly. Check the auth environment variables.",
};

const labels: Record<string, string> = {
  google: "Continue with Google",
  "microsoft-entra-id": "Continue with Microsoft",
  demo: "Continue as the demo founder",
};

export default async function SignInPage({ searchParams }: PageProps<"/signin">) {
  if (await getCurrentUser()) redirect("/");
  const { error } = await searchParams;
  const providers = configuredProviders();
  const message = typeof error === "string" ? (errors[error] ?? "Sign-in failed. Please try again.") : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            Founder<sup>2</sup>
          </CardTitle>
          <CardDescription>
            Sign in to capture how you sell. We&apos;ll also ask to read your calendar so reps get a brief before each client
            call. That part is optional.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {message && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {message}
            </p>
          )}
          {providers.map((p) => (
            <form key={p.id} action={signInWith.bind(null, p.id)}>
              <Button type="submit" variant={p.id === "demo" ? "outline" : "default"} className="w-full">
                {labels[p.id] ?? `Continue with ${p.name}`}
              </Button>
            </form>
          ))}
          {providers.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No sign-in providers are configured. Set Google or Microsoft credentials, or DEMO_MODE=true.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
