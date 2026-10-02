import { prisma } from "@project/db";
import type { CreateIdentityInput } from "../schemas/identity";

export function createIdentity(input: CreateIdentityInput) {
  return prisma.user.create({
    data: input,
  });
}


export function getIdentityById(id: string) {
    return prisma.user.findUnique({
        where: { id }
    });
}