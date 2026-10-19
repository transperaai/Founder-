import { randomBytes } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("crypto", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = randomBytes(32).toString("base64");
  });

  it("round-trips strings and JSON", async () => {
    const { decrypt, decryptJson, encrypt, encryptJson } = await import("./crypto");
    expect(decrypt(encrypt("fathom-key-123"))).toBe("fathom-key-123");
    expect(decryptJson(encryptJson({ refreshToken: "r" }))).toEqual({ refreshToken: "r" });
  });

  it("never stores the plaintext and uses a fresh IV each time", async () => {
    const { encrypt } = await import("./crypto");
    const a = encrypt("secret");
    expect(a).not.toContain("secret");
    expect(encrypt("secret")).not.toBe(a);
  });

  it("rejects tampered ciphertext", async () => {
    const { decrypt, encrypt } = await import("./crypto");
    const parts = encrypt("secret").split(".");
    parts[3] = Buffer.from("tampered").toString("base64url");
    expect(() => decrypt(parts.join("."))).toThrow();
  });

  it("fails clearly without a key", async () => {
    delete process.env.ENCRYPTION_KEY;
    const { encrypt } = await import("./crypto");
    expect(() => encrypt("x")).toThrow("ENCRYPTION_KEY is not set");
  });
});
