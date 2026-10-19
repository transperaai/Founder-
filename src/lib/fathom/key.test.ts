import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/founder", () => ({ getFounder: vi.fn() }));
beforeAll(() => {
  process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
});
const { encrypt } = await import("@/lib/crypto");
const { resolveFathomKey } = await import("./key");

describe("resolveFathomKey", () => {
  it("prefers the key saved in Settings over the deployment default", () => {
    expect(resolveFathomKey({ fathomApiKey: encrypt("saved-key"), fathomUseDefaultKey: true }, "env-key")).toEqual({ key: "saved-key", source: "saved" });
  });

  it("falls back to FATHOM_API_KEY when nothing is saved", () => {
    expect(resolveFathomKey({ fathomApiKey: null, fathomUseDefaultKey: true }, "env-key")).toEqual({ key: "env-key", source: "default" });
  });

  it("doesn't use the default once the founder removed the connection", () => {
    expect(resolveFathomKey({ fathomApiKey: null, fathomUseDefaultKey: false }, "env-key")).toBeNull();
  });

  it("is null with neither key", () => {
    expect(resolveFathomKey({ fathomApiKey: null, fathomUseDefaultKey: true }, undefined)).toBeNull();
  });
});
