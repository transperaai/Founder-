import { PageHeader, UnderConstruction } from "@/components/placeholders";

export const metadata = { title: "Dashboard · Founder²" };

export default function Page() {
  return (
    <>
      <PageHeader title="Dashboard" description="Your focus habit, progress and recent calls." />
      <UnderConstruction issue={14} />
    </>
  );
}
