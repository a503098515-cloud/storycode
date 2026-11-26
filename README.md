<!--
This becomes YOUR project's README. When your project has a name:

    cp README.template.md README.md

…then fill every <placeholder>, delete these guidance comments, and land it
as a PR (a good first "docs rode along" PR). The starter's original README
always lives on in the template repo — you lose nothing by replacing it.
Everything not in <angle brackets> is already true of this codebase; keep it.
-->

# Story Code

*Learn with a story to make coding fun.*

**Live:** https://storycode-eight.vercel.app

<!-- Optional but recommended: one screenshot or GIF of the thing working.
     A README with a picture gets read; a wall of text gets skimmed. -->

## What it does

<!-- One line per shipped feature, linking its spec — the spec is the full
     story, this list is the menu. Grows as features land. -->
- Coding challenge levels ([spec](docs/specs/levels/levels.md))
- Code editor to submit answers ([spec](docs/specs/submissions/submissions.md))
- AI-powered tips and explanations 

## Run it locally

No Docker, no cloud account — everything runs from npm.

```bash
pnpm install
pnpm prisma:generate     # typed DB client
pnpm dev                 # web + worker + your own Postgres + Azurite
pnpm db:seed             # demo data (with dev running)
```

Check it worked: `http://localhost:3000/api/health` → `{"status":"ok","db":"ok"}`.
All commands: see `package.json` scripts, or `CONTRIBUTING.md` for the
pre-push set (`pnpm test && pnpm typecheck && pnpm build`).

## How it's built
The app is built with a frontend in React and TypeScript along with a backend in Node.js and Next.js. We use PostgreSQL to store data of user profiles, their progress, and levels. There are authentication methods including username/password, Google, and GitHub auth.

The deeper story lives in the docs, organized by the question you're asking —
decisions in [`docs/adr/`](docs/adr/), behavior in [`docs/specs/`](docs/specs/),
history in [`docs/postmortems/`](docs/postmortems/), procedures in
[`docs/runbooks/`](docs/runbooks/). Start at [`docs/README.md`](docs/README.md).

## Team

<!-- Who builds this. Link GitHubs. Your team charter has the roles. -->

- AJ — <a href="https://github.com/sudo-lock-in">sudo-lock-in</a>
- Jiarong Kong — <a href="https://github.com/a503098515-cloud">a503098515-cloud</a>
- Karthikeya — <a href="https://github.com/b-Karthikeya-reddy">b-Karthikeya-reddy</a>
-  Osei Boakye — <a href="https://github.com/OseiKBoakye">OseiKBoakye</a>


## Contributing

Workflow, ground rules, and the documentation system: [`CONTRIBUTING.md`](CONTRIBUTING.md).
Agent conventions (any harness): [`AGENTS.md`](AGENTS.md).

---

<sub>Built on the CTP C12 full-stack starter — Next.js · Prisma · Postgres · Vercel.</sub>
