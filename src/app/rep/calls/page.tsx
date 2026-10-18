import { PageHeader, UnderConstruction } from "@/components/placeholders";

export const metadata = { title: "My calls · Founder²" };

export default function Page() {
  return (
    <>
      <PageHeader title="My calls" description="Your analysed calls and feedback." />
      <UnderConstruction issue={8} />
    </>
  );
}
