-- Coding-challenge content on levels. Both nullable: a level without tests
-- keeps the plain editor + submit flow.
ALTER TABLE "Level" ADD COLUMN "starterCode" TEXT;
ALTER TABLE "Level" ADD COLUMN "challengeTests" JSONB;
