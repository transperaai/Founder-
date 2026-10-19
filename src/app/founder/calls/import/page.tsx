import Link from "next/link";
import { listFathomMeetings } from "@/app/actions/fathom";
import { ImportProgress } from "@/components/fathom/import-progress";
import { MeetingPicker } from "@/components/fathom/meeting-picker";
import { PageHeader } from "@/components/placeholders";
import { resolveFathomKey } from "@/lib/fathom/key";
import { requireCurrentUser } from "@/lib/session";

export const metadata = { title: "Import from Fathom · Founder²" };

export default async function ImportPage() {
  const user = await requireCurrentUser();
  const connected = Boolean(resolveFathomKey(user));

  return (
    <>
      <PageHeader title="Import from Fathom" description="Tick the calls to import. Nothing else is read." />
      <div className="flex flex-col gap-6">
        {connected ? (
          <MeetingPicker initial={await listFathomMeetings()} />
        ) : (
          <p className="text-sm">
            Fathom isn&apos;t connected.{" "}
            <Link href="/founder/settings/fathom" className="underline underline-offset-4">
              Add your API key
            </Link>
            .
          </p>
        )}
        <ImportProgress />
        <Link href="/founder/calls" className="text-sm font-medium underline underline-offset-4">
          Back to calls
        </Link>
      </div>
    </>
  );
}
