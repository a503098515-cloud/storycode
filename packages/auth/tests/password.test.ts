import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../src/password";

describe("password hashing", () => {
  it("verifies the correct password but rejects a different one", async () => {
    const hash = await hashPassword("correct horse battery");

    await expect(verifyPassword("correct horse battery", hash)).resolves.toBe(true);
    await expect(verifyPassword("incorrect password", hash)).resolves.toBe(false);
  });

  it("uses a unique salt for each hash", async () => {
    const first = await hashPassword("correct horse battery");
    const second = await hashPassword("correct horse battery");

    expect(first).not.toBe(second);
    await expect(verifyPassword("correct horse battery", second)).resolves.toBe(true);
  });

  it("rejects malformed hashes and invalid password lengths", async () => {
    await expect(verifyPassword("password", "not-a-hash")).resolves.toBe(false);
    await expect(hashPassword("short")).rejects.toThrow();
    await expect(hashPassword("x".repeat(129))).rejects.toThrow();
  });
});
