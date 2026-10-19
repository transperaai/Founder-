import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PROFILE_FIELDS, type BusinessProfile } from "@/lib/business-context";

const errorMessages: Record<string, string> = {
  not_configured: "AI isn't configured on this deployment (no Anthropic API key), so we couldn't draft your profile. Write it below instead.",
  invalid_output: "We couldn't draft your profile this time. Write it below, or try the questions again.",
  refusal: "We couldn't draft your profile from those answers. Write it below instead.",
  api_error: "The AI service didn't respond. Write your profile below, or try again in a minute.",
};

/** The business context profile card: every field editable inline, then approve. */
export function ProfileEditor({
  action,
  profile,
  version,
  approvedAt,
  error,
  submitLabel = "Approve profile",
}: {
  action: (form: FormData) => Promise<void>;
  profile: BusinessProfile | null;
  version: number;
  approvedAt: Date | null;
  error?: string;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Version {version}</span>
        <Badge variant={approvedAt ? "secondary" : "outline"}>{approvedAt ? "Approved" : "Draft"}</Badge>
      </div>
      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessages[error] ?? errorMessages.invalid_output}
        </p>
      )}
      {PROFILE_FIELDS.map((f) => (
        <div key={f.id} className="flex flex-col gap-2">
          <Label htmlFor={f.id}>{f.label}</Label>
          <Textarea id={f.id} name={f.id} rows={2} required defaultValue={profile?.[f.id] ?? ""} />
        </div>
      ))}
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
