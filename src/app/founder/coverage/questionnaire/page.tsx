import { ComingSoon, PageHeader } from "@/components/placeholders";

export const metadata = { title: "Gap-filling questionnaire · Founder²" };

const sampleQuestions = [
  "A client asks for a 15% discount in negotiation. Walk us through what you say.",
  "How do you open a quarterly review when results are down?",
  "What do you say when procurement wants to put you out to tender?",
];

export default function QuestionnairePage() {
  return (
    <>
      <PageHeader title="Gap-filling questionnaire" />
      <ComingSoon
        title="Questionnaire"
        explainer="Where your calls are thin, Founder² will ask you a few targeted questions. Your answers become playbook items, so reps get guidance even for situations you haven't recorded."
      >
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          {sampleQuestions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
      </ComingSoon>
    </>
  );
}
