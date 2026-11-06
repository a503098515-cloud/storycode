// Seeds starter levels. Safe to re-run through unique keys.
// Run via: pnpm db:seed

import { prisma } from "@project/db";

// challengeTests must match ChallengeTests (packages/domain) — see
// docs/specs/levels/coding-challenge.md. Omitted = no tests for that level.
const LEVELS = [
  {
    title: "The First Function",
    storyText:
      "You wake at the gate of a walled city. The guard won't let anyone in who can't greet the townsfolk properly — and the townsfolk only answer to their own names.",
    codingChallenge:
      'Write a function greet(name) that returns a greeting for that name. greet("Ada") should return "Hello, Ada!"',
    starterCode: "function greet(name) {\n  // your code here\n}\n",
    challengeTests: {
      functionName: "greet",
      cases: [
        { args: ["Ada"], expected: "Hello, Ada!" },
        { args: ["Grace"], expected: "Hello, Grace!" },
        { args: ["World"], expected: "Hello, World!" },
      ],
    },
    order: 1,
  },
  { title: "The Next Step", storyText: "The path continues with a new constraint.", codingChallenge: "Explain your approach in code.", order: 2 },
];

async function main() {
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
