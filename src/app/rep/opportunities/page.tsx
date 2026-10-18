import { PageHeader, UnderConstruction } from "@/components/placeholders";

export const metadata = { title: "Opportunities · Founder²" };

export default function Page() {
  return (
    <>
      <PageHeader title="Opportunities" description="Opportunities you've spotted on calls." />
      <UnderConstruction issue={15} />
    </>
  );
}
