# @project/migrate — the migration CLI and seed script

One-shot tools for managing the database schema and seed data. CI uses these
against a Postgres service container; local dev rarely needs them because the
db-server auto-applies migrations on boot.

## What it does

| Script | Command | Purpose |
|---|---|---|
| `src/index.ts` | `pnpm db:migrate` | Apply pending migrations over the wire |
| `src/seed.ts` | `pnpm db:seed` | Seed starter levels |

## Dependencies

- `@project/db` — `applyMigrations` for running SQL migration files
- `pg` — the PostgreSQL client driver

## Consumers

Developers and CI. No code imports from `@project/migrate`.

## Local dev

```bash
pnpm db:migrate      # apply pending migrations
pnpm db:seed         # seed starter levels (safe to re-run — upserts)
```

Requires the database server running (start it with `pnpm dev` or `pnpm db:dev`).

## The seed data

The seed creates two starter levels. Sign-in creates user accounts on first use,
so no demo account is seeded. Edit `src/seed.ts` to change the starting data.