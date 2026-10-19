// Who may sign in. One organisation per deployment: the first person to sign in
// becomes the founder; after that only existing users and allowlisted emails.

export function parseAllowlist(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function canSignIn({
  email,
  userCount,
  existingUser,
  allowlist,
}: {
  email: string;
  userCount: number;
  existingUser: boolean;
  allowlist: string[];
}): boolean {
  if (existingUser) return true;
  if (userCount === 0) return true;
  return allowlist.includes(email.toLowerCase());
}

/** Whether the provider granted calendar read access, from the granted scope string. */
export function hasCalendarScope(provider: string, scope: string | undefined): boolean {
  if (!scope) return false;
  const scopes = scope.split(/\s+/);
  if (provider === "google") return scopes.includes("https://www.googleapis.com/auth/calendar.readonly");
  if (provider === "microsoft-entra-id") return scopes.some((s) => s.toLowerCase().endsWith("calendars.read"));
  return false;
}
