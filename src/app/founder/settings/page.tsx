import { PageHeader, UnderConstruction } from "@/components/placeholders";

export const metadata = { title: "Settings · Founder²" };

export default function Page() {
  return (
    <>
      <PageHeader title="Settings" description="Business context and integrations." />
      <UnderConstruction issue={6} />
    </>
  );
}
