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
    const created = await domain.createSubmission(owner.id, {
      levelId: level.id,
      codeSubmitted: "print(1)",
      isPassed: false,
    });
    expect(created.userId).toBe(owner.id);
    expect((await domain.listSubmissions(stranger.id))).toHaveLength(0);
  });

  it("stores and returns a level's starter code and challenge tests", async () => {
    const challengeTests = {
      functionName: "greet",
      cases: [{ args: ["Ada"], expected: "Hello, Ada!" }],
    };
    const created = await db.prisma.level.create({
      data: {
        title: "Gate",
        storyText: "Greet the guard.",
        codingChallenge: "Write greet(name).",
        starterCode: "function greet(name) {}\n",
        challengeTests,
        order: 100,
      },
    });

    const level = await domain.getLevel(created.id);
    expect(level?.starterCode).toBe("function greet(name) {}\n");
    expect(domain.ChallengeTests.parse(level?.challengeTests)).toEqual(challengeTests);
  });

  it("leaves challenge fields null for a level without tests", async () => {
    const created = await db.prisma.level.create({
      data: { title: "Plain", storyText: "No tests.", codingChallenge: "Explain.", order: 101 },
    });
    const level = await domain.getLevel(created.id);
    expect(level?.starterCode).toBeNull();
    expect(level?.challengeTests).toBeNull();
  });
});
