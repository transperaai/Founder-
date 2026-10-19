import { describe, expect, it } from "vitest";
import { clientDomainFor, defaultRoleFor, emailDomain, isInternalCall } from "./domain";

describe("isInternalCall", () => {
  it("is internal when every attendee shares the founder's domain", () => {
    expect(isInternalCall(["peter@brightside.agency", "Sam@Brightside.Agency"], "brightside.agency")).toBe(true);
  });

  it("is external when any attendee is from another domain", () => {
    expect(isInternalCall(["peter@brightside.agency", "dana@northwind.com"], "brightside.agency")).toBe(false);
  });

  it("can't call a call internal without attendees or a founder domain", () => {
    expect(isInternalCall([], "brightside.agency")).toBe(false);
    expect(isInternalCall(["peter@brightside.agency"], null)).toBe(false);
  });
});

describe("clientDomainFor", () => {
  it("picks the most common non-founder domain", () => {
    expect(clientDomainFor(["peter@brightside.agency", "a@x.com", "b@northwind.com", "c@northwind.com"], "brightside.agency")).toBe("northwind.com");
  });

  it("is null for an internal call", () => {
    expect(clientDomainFor(["peter@brightside.agency"], "brightside.agency")).toBeNull();
  });
});

describe("defaultRoleFor", () => {
  it("makes onboarding imports and uploads founder calls, and webhook arrivals rep calls", () => {
    expect(defaultRoleFor("onboarding_import")).toBe("founder");
    expect(defaultRoleFor("upload")).toBe("founder");
    expect(defaultRoleFor("webhook")).toBe("rep");
  });
});

it("emailDomain lower-cases and tolerates junk", () => {
  expect(emailDomain(" Dana@Northwind.COM ")).toBe("northwind.com");
  expect(emailDomain("nobody")).toBe("");
});
