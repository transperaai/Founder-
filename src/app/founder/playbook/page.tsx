import { PageHeader, UnderConstruction } from "@/components/placeholders";

export const metadata = { title: "Playbook · Founder²" };

export default function Page() {
  return (
    <>
      <PageHeader title="Playbook" description="How you sell, extracted from your calls." />
      <UnderConstruction issue={10} />
    </>
  );
}
