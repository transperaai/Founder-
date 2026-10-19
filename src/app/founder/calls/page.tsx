import { PageHeader, UnderConstruction } from "@/components/placeholders";

export const metadata = { title: "Calls · Founder²" };

export default function Page() {
  return (
    <>
      <PageHeader title="Calls" description="Every imported call, its tags and analysis status." />
      <UnderConstruction issue={8} />
    </>
  );
}
