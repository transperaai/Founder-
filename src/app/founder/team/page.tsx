import { ComingSoon, LaterLine, PageHeader } from "@/components/placeholders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata = { title: "Team · Founder²" };

const roles = [
  { role: "Account manager", path: "Listening first: client talk time, next-quarter priorities, summarising back." },
  { role: "Producer", path: "Scoping and next steps: confirming what the client wants, dated next steps." },
  { role: "Strategist", path: "Value and awareness: tying offers to problems, client stories, matching awareness." },
];

export default function TeamPage() {
  return (
    <>
      <PageHeader title="Team" description="Your reps and their habit paths." />
      <div className="flex flex-col gap-4">
        <ComingSoon
          title="Invite your team"
          explainer="Invite reps by email and pick each rep's role, which sets the order they build habits in. You'll also choose what each rep can see: for example, whether they can browse other reps' calls."
        >
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input placeholder="rep@youragency.com" disabled aria-label="Rep email" />
              <Button disabled>Invite</Button>
            </div>
            <ul className="flex flex-col gap-2 text-sm">
              {roles.map((r) => (
                <li key={r.role}>
                  <span className="font-medium">{r.role}:</span> <span className="text-muted-foreground">{r.path}</span>
                </li>
              ))}
            </ul>
          </div>
        </ComingSoon>
        <LaterLine>Reps will sign in with their own account and connect their own Fathom in a later version.</LaterLine>
      </div>
    </>
  );
}
