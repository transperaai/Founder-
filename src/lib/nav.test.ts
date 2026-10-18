import { describe, expect, it } from "vitest";
import { founderNav, homeFor, navFor, repNav } from "./nav";

describe("nav", () => {
  it("lands each view on its home screen", () => {
    expect(homeFor("founder")).toBe("/founder/inbox");
    expect(homeFor("rep")).toBe("/rep/dashboard");
  });

  it("has the spec's nav items in order", () => {
    expect(navFor("founder").map((i) => i.label)).toEqual([
      "Inbox", "Playbook", "Calls", "Opportunities", "Reports", "Digest", "Team", "Settings",
    ]);
    expect(navFor("rep").map((i) => i.label)).toEqual([
      "Dashboard", "My calls", "Playbook", "Ask the founder", "Opportunities",
    ]);
  });

  it("keeps each view's routes under its own prefix", () => {
    expect(founderNav.every((i) => i.href.startsWith("/founder/"))).toBe(true);
    expect(repNav.every((i) => i.href.startsWith("/rep/"))).toBe(true);
  });
});
