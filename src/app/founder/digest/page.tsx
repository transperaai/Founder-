import { PageHeader, UnderConstruction } from "@/components/placeholders";

export const metadata = { title: "Weekly digest · Founder²" };

export default function Page() {
  return (
    <>
      <PageHeader title="Weekly digest" description="A preview of the Friday email." />
      <UnderConstruction issue={18} />
    </>
  );
}
