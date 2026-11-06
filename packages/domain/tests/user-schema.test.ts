import { describe, expect, it } from "vitest";
import { SignIn } from "../src/schemas/user";

describe("sign-in input", () => {
  it("normalizes usernames and preserves passwords", () => {
    expect(SignIn.parse({ username: " Alice_1 ", password: "pass phrase" })).toEqual({
      username: "alice_1",
      password: "pass phrase",
    });
  });

  it("rejects invalid usernames and password lengths", () => {
    expect(SignIn.safeParse({ username: "ab", password: "long enough" }).success).toBe(false);
    expect(SignIn.safeParse({ username: "valid_user", password: "short" }).success).toBe(false);
    expect(
      SignIn.safeParse({ username: "valid_user", password: "x".repeat(129) }).success
    ).toBe(false);
  });
});
