import { describe, expect, it } from "vitest";
import { answersFromForm, profileFromForm, profileSaveAction, type BusinessProfile } from ".";

const profile: BusinessProfile = { idealClients: "a", offer: "b", differentiators: "c", salesProcess: "d", commonObjections: "e" };

describe("profileSaveAction", () => {
  it("updates an unapproved draft in place", () => {
    expect(profileSaveAction({ approvedAt: null, profileSummary: profile }, { ...profile, offer: "x" })).toBe("update");
  });

  it("creates a new version when an approved profile is edited", () => {
    expect(profileSaveAction({ approvedAt: new Date(), profileSummary: profile }, { ...profile, offer: "x" })).toBe("new_version");
  });

  it("doesn't create a version when nothing changed", () => {
    expect(profileSaveAction({ approvedAt: new Date(), profileSummary: profile }, { ...profile })).toBe("approve_only");
  });
});

describe("form parsing", () => {
  it("reads and trims every question and profile field", () => {
    const form = new FormData();
    form.set("bestClients", "  retail brands ");
    form.set("offer", " sites ");
    expect(answersFromForm(form).bestClients).toBe("retail brands");
    expect(answersFromForm(form).whyUs).toBe("");
    expect(profileFromForm(form).offer).toBe("sites");
  });
});
