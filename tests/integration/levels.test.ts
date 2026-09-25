import { describe, it, expect, beforeAll } from "vitest";

type Domain = typeof import("@project/domain");
let domain: Domain;
let db: typeof import("@project/db");

beforeAll(async () => {
  process.env.PGLITE_DATA_DIR = "memory://";
  delete process.env.DATABASE_URL;
  domain = await import("@project/domain");
  db = await import("@project/db");
}, 30000);

describe("level and submission domain (PGlite door)", () => {
  it("find-or-create is idempotent per email", async () => {
    const a = await domain.findOrCreateUser("ada-it@example.com");
    const b = await domain.findOrCreateUser("ada-it@example.com");
    expect(b.id).toBe(a.id);
  });

  it("keeps submissions scoped to their user", async () => {
    const owner = await domain.findOrCreateUser("owner-it@example.com");
    const stranger = await domain.findOrCreateUser("stranger-it@example.com");
    const level = await db.prisma.level.create({
      data: { title: "Intro", storyText: "Begin.", codingChallenge: "Print 1", order: 1 },
    });
    const created = await domain.createSubmission(owner.id, level.id, "print(1)");
    expect(created.userId).toBe(owner.id);
    expect((await domain.listSubmissions(stranger.id))).toHaveLength(0);
  });
});