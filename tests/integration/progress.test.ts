import { beforeAll, describe, expect, it } from "vitest";

let postProgress: (request: Request) => Promise<Response>;
let db: typeof import("@project/db");

beforeAll(async () => {
  process.env.PGLITE_DATA_DIR = "memory://";
  delete process.env.DATABASE_URL;

  const handlerModule = await import(
    new URL("../../apps/web/app/api/progress/handler.ts", import.meta.url).href
  );
  db = await import("@project/db");

  postProgress = handlerModule.createProgressHandler(async () => currentUserId);
}, 30000);

let currentUserId: string | null = null;

describe("POST /api/progress", () => {
  it("persists the current level for the signed-in user", async () => {
    const user = await db.prisma.user.create({
      data: { name: "Progress User", email: "progress-happy@example.com" },
    });
    const level = await db.prisma.level.create({
      data: { title: "Intro", storyText: "Begin.", codingChallenge: "Print 1", order: 1 },
    });
    currentUserId = user.id;

    const response = await postProgress(
      new Request("http://localhost/api/progress", {
        method: "POST",
        body: JSON.stringify({ currentLevelId: level.id }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ progress: { currentLevelId: level.id } });
    expect((await db.prisma.user.findUnique({ where: { id: user.id } }))?.currentLevelId).toBe(
      level.id
    );
  });

  it("reads the signed-in user's saved progress", async () => {
    const user = await db.prisma.user.create({
      data: { name: "Progress Read User", email: "progress-read@example.com" },
    });
    const level = await db.prisma.level.create({
      data: { title: "Read", storyText: "Continue.", codingChallenge: "Print 2", order: 2 },
    });
    currentUserId = user.id;
    await db.prisma.user.update({ where: { id: user.id }, data: { currentLevelId: level.id } });

    const response = await postProgress(new Request("http://localhost/api/progress", { method: "GET" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ progress: { currentLevelId: level.id } });
  });

  it("rejects an unknown level without changing progress", async () => {
    const user = await db.prisma.user.create({
      data: { name: "Progress Sad User", email: "progress-sad@example.com" },
    });
    currentUserId = user.id;

    const response = await postProgress(
      new Request("http://localhost/api/progress", {
        method: "POST",
        body: JSON.stringify({ currentLevelId: "missing-level" }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: { code: "NOT_FOUND", message: "Level not found" },
    });
    expect((await db.prisma.user.findUnique({ where: { id: user.id } }))?.currentLevelId).toBeNull();
  });
});