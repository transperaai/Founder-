import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const errorMessages: Record<string, string> = {
  empty: "Paste your Fathom API key first.",
  unauthorized: "Fathom didn't accept that key. Copy it again from Fathom → Settings → API Access.",
  rate_limited: "Fathom is rate limiting requests. Wait a minute and try again.",
  unavailable: "We couldn't reach Fathom. Try again in a minute.",
  bad_request: "Fathom rejected the request. Check the key and try again.",
  invalid_response: "Fathom answered in a way we didn't expect. Try again, or contact support.",
  not_found: "Fathom didn't recognise the request. Check the key and try again.",
};

/** Paste a Fathom API key; the action validates it against Fathom before storing it. */
export function FathomKeyForm({
  action,
  error,
  submitLabel = "Connect Fathom",
}: {
  action: (form: FormData) => Promise<void>;
  error?: string;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="apiKey">Fathom API key</Label>
        <Input id="apiKey" name="apiKey" type="password" autoComplete="off" required placeholder="Paste your key" />
        <p className="text-xs text-muted-foreground">In Fathom: Settings → API Access → Generate API key. We store it encrypted.</p>
      </div>
      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessages[error] ?? errorMessages.unauthorized}
        </p>
      )}
      <SubmitButton pendingLabel="Checking with Fathom…">{submitLabel}</SubmitButton>
    </form>
  );
}
