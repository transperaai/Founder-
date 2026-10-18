import { PageHeader, UnderConstruction } from "@/components/placeholders";

export const metadata = { title: "Ask the founder · Founder²" };

export default function Page() {
  return (
    <>
      <PageHeader title="Ask the founder" description="Get answers from the founder's playbook." />
      <UnderConstruction issue={19} />
    </>
  );
}
