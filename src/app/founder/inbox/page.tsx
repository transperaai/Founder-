import { LaterLine, PageHeader, UnderConstruction } from "@/components/placeholders";

export const metadata = { title: "Inbox · Founder²" };

export default function Page() {
  return (
    <>
      <PageHeader title="Inbox" description="Questions and prompts that turn your know-how into playbook items." />
      <div className="flex flex-col gap-4">
        <UnderConstruction issue={11} />
        <LaterLine>Proposals, decks and pricing documents can be added here in a later version.</LaterLine>
      </div>
    </>
  );
}
