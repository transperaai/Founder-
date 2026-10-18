import type { View } from "@prisma/client";

export type NavItem = { href: string; label: string };

export const founderNav: NavItem[] = [
  { href: "/founder/inbox", label: "Inbox" },
  { href: "/founder/playbook", label: "Playbook" },
  { href: "/founder/calls", label: "Calls" },
  { href: "/founder/opportunities", label: "Opportunities" },
  { href: "/founder/reports", label: "Reports" },
  { href: "/founder/digest", label: "Digest" },
  { href: "/founder/team", label: "Team" },
  { href: "/founder/settings", label: "Settings" },
];

export const repNav: NavItem[] = [
  { href: "/rep/dashboard", label: "Dashboard" },
  { href: "/rep/calls", label: "My calls" },
  { href: "/rep/playbook", label: "Playbook" },
  { href: "/rep/ask", label: "Ask the founder" },
  { href: "/rep/opportunities", label: "Opportunities" },
];

export const navFor = (view: View) => (view === "founder" ? founderNav : repNav);

/** The home screen for each view: the first nav item. */
export const homeFor = (view: View) => navFor(view)[0].href;
