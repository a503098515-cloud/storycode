// Seeds demo users and starter levels. Safe to re-run through unique keys.
// Run via: pnpm db:seed

import { prisma } from "@project/db";

const USERS = [
  { email: "ada@example.com", name: "Ada" },
  { email: "grace@example.com", name: "Grace" },
];

const LEVELS = [
  { title: "The First Function", storyText: "A small problem opens the story.", codingChallenge: "Write a function that returns 1.", order: 1 },
  { title: "The Next Step", storyText: "The path continues with a new constraint.", codingChallenge: "Explain your approach in code.", order: 2 },
];

async function main() {
  for (const user of USERS) {
    const savedUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });

    console.log(`seed: ensured ${savedUser.email}`);
  }

  for (const level of LEVELS) {
    await prisma.level.upsert({ where: { order: level.order }, update: level, create: level });
  }
  console.log(`seed: ensured ${LEVELS.length} levels`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
