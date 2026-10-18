import { PageHeader, UnderConstruction } from "@/components/placeholders";

export const metadata = { title: "Playbook · Founder²" };

export default function Page() {
  return (
    <>
      <PageHeader title="Playbook" description="How the founder sells." />
      <UnderConstruction issue={10} />
    </>
  );
}
