// Boundary contracts: what the API accepts. If these change, the client and
// the server change together — that's why they live in one shared package.
import { describe, it, expect } from "vitest";
import { CreateTodo, ToggleTodo } from "../src/schemas/todo";
import { Email } from "../src/schemas/user";

describe("CreateTodo schema", () => {
  it("accepts a valid todo", () => {
    expect(CreateTodo.safeParse({ title: "Learn to read code" }).success).toBe(true);
  });

  it("trims and rejects empty titles", () => {
    expect(CreateTodo.safeParse({ title: "   " }).success).toBe(false);
    expect(CreateTodo.safeParse({}).success).toBe(false);
  });

  it("rejects a title over 200 characters", () => {
    expect(CreateTodo.safeParse({ title: "x".repeat(201) }).success).toBe(false);
  });
});

describe("ToggleTodo schema", () => {
  it("requires a boolean, not a truthy string", () => {
    expect(ToggleTodo.safeParse({ done: true }).success).toBe(true);
    expect(ToggleTodo.safeParse({ done: "true" }).success).toBe(false);
    expect(ToggleTodo.safeParse({}).success).toBe(false);
  });
});

describe("Email schema", () => {
  it("normalizes case and whitespace", () => {
    const r = Email.safeParse("  Ada@example.com ");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("ada@example.com");
  });

  it("rejects malformed addresses", () => {
    expect(Email.safeParse("not-an-email").success).toBe(false);
    expect(Email.safeParse("ada@").success).toBe(false);
    expect(Email.safeParse("ada example.com").success).toBe(false);
  });
});
