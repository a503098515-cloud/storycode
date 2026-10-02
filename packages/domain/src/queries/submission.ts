// Database queries for todos. Every query is scoped by userId — no exceptions.
// A todo and its event are written in a single transaction, always.
// Database queries for todos. Every query is scoped by userId — no exceptions.
import { prisma } from "@project/db";
import type { CreateSubmissionInput } from "../schemas/submission";

// get all lists
export function listSubmissions(userId: string) {
  return prisma.submission.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

// Get ID
export function getSubmissionById(userId: string, submissionId: string) {
  return prisma.submission.findFirst({
    where: {
      id: submissionId,
      userId,
    },
  });
}

// Save a new submission 
export async function createSubmission(userId: string, input: CreateSubmissionInput) {
  return prisma.$transaction(async (tx) => {
  
    await tx.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: `${userId}@example.com`,
        name: "Test User",
      },
    });
    await tx.level.upsert({
      where: { id: input.levelId },
      update: {},
      create: {
        id: input.levelId,
        title: `Level ${input.levelId}`,
        storyText: "Intro story",
        codingChallenge: "Write your code here",
        order: 1,
      },
    });
    return tx.submission.create({
      data: {
        userId,
        ...input,
      },
    });
  });
}