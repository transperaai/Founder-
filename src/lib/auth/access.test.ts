import { describe, expect, it } from "vitest";
import { canSignIn, hasCalendarScope, parseAllowlist } from "./access";

describe("canSignIn", () => {
  const base = { email: "new@agency.com", userCount: 1, existingUser: false, allowlist: [] };

  it("lets the first user in", () => {
    expect(canSignIn({ ...base, userCount: 0 })).toBe(true);
  });

  it("lets existing users back in", () => {
    expect(canSignIn({ ...base, existingUser: true })).toBe(true);
  });

  it("refuses strangers once the workspace has a founder", () => {
    expect(canSignIn(base)).toBe(false);
  });

  it("admits allowlisted emails, case-insensitively", () => {
    expect(canSignIn({ ...base, email: "New@Agency.com", allowlist: parseAllowlist(" new@agency.com , x@y.z") })).toBe(true);
  });
});

describe("hasCalendarScope", () => {
  it("detects Google calendar.readonly", () => {
    expect(hasCalendarScope("google", "openid email https://www.googleapis.com/auth/calendar.readonly")).toBe(true);
    expect(hasCalendarScope("google", "openid email profile")).toBe(false);
  });

  it("detects Microsoft Graph Calendars.Read", () => {
    expect(hasCalendarScope("microsoft-entra-id", "openid profile https://graph.microsoft.com/Calendars.Read")).toBe(true);
    expect(hasCalendarScope("microsoft-entra-id", "openid profile User.Read")).toBe(false);
  });

  it("treats a missing scope as not granted", () => {
    expect(hasCalendarScope("google", undefined)).toBe(false);
  });
});
