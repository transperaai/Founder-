import { PageHeader, UnderConstruction } from "@/components/placeholders";

export const metadata = { title: "Team · Founder²" };

export default function Page() {
  return (
    <>
      <PageHeader title="Team" description="Your reps and their habit paths." />
      <UnderConstruction issue={4} />
    </>
  );
}
