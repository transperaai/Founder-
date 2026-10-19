import { PageHeader, UnderConstruction } from "@/components/placeholders";

export const metadata = { title: "Reports · Founder²" };

export default function Page() {
  return (
    <>
      <PageHeader title="Reports" description="30-day and 90-day impact." />
      <UnderConstruction issue={18} />
    </>
  );
}
