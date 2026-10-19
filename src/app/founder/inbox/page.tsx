import { PageHeader, UnderConstruction } from "@/components/placeholders";

export const metadata = { title: "Inbox · Founder²" };

export default function Page() {
  return (
    <>
      <PageHeader title="Inbox" description="Questions and prompts that turn your know-how into playbook items." />
      <UnderConstruction issue={11} />
    </>
  );
}
