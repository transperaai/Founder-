import Link from "next/link";
import { PageHeader, UnderConstruction } from "@/components/placeholders";

export const metadata = { title: "Calls · Founder²" };

export default function Page() {
  return (
    <>
      <PageHeader title="Calls" description="Every imported call, its tags and analysis status." />
      <div className="flex flex-col gap-4">
        <Link href="/founder/coverage" className="text-sm font-medium underline underline-offset-4">
          Check coverage
        </Link>
        <UnderConstruction issue={8} />
      </div>
    </>
  );
}
