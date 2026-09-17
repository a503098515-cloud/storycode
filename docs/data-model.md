# Data Model Specification: StoryCode

## The Problem
Staying committed to learning programming can be hard. That is why we are building a story-based game with coding challenges applicable to real world scenarios for engaged learning.

## Entities & Relationships

### 1. User
Represents a student/player in the system.
- `id`: Unique identifier (CUID)
- `name`: User's name
- `email`: User's unique email
- `currentLevelId`: ID of the level the user is currently on

### 2. Level
Represents a coding challenge step in the story mode.
- `id`: Unique identifier (CUID)
- `title`: Level title
- `storyText`: Story content/dialogue
- `codingChallenge`: Prompt/code requirement
- `order`: Sequential order of the level

### 3. Submission
Tracks player submissions for each level.
- `id`: Unique identifier (CUID)
- `userId`: Foreign key referencing `User`
- `levelId`: Foreign key referencing `Level`
- `codeSubmitted`: Source code submitted by the user
- `isPassed`: Boolean indicating pass/fail state

## Verification
- Validated Prisma Schema via `pnpm exec prisma validate`.
- Generated initial SQL DDL migration script at `packages/db/prisma/migrations/0001_init.sql`.