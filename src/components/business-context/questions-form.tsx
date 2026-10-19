import { SubmitButton } from "@/components/submit-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QUESTIONS, type BusinessAnswers } from "@/lib/business-context";

export function QuestionsForm({
  action,
  defaults,
}: {
  action: (form: FormData) => Promise<void>;
  defaults?: Partial<BusinessAnswers>;
}) {
  return (
    <form action={action} className="flex flex-col gap-5">
      {QUESTIONS.map((q, i) => (
        <div key={q.id} className="flex flex-col gap-2">
          <Label htmlFor={q.id}>
            {i + 1}. {q.label}
          </Label>
          <Textarea id={q.id} name={q.id} rows={3} required defaultValue={defaults?.[q.id] ?? ""} />
        </div>
      ))}
      <SubmitButton pendingLabel="Writing your profile…">Create my profile</SubmitButton>
    </form>
  );
}
