# Founder²

Internal MVP: captures how an agency founder sells from their Fathom calls, builds a playbook, and coaches reps against it. The product spec is [issue #1](https://github.com/transperaai/Founder-/issues/1); work is tracked as its sub-issues.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind 4 · shadcn/ui (Base UI) · Prisma 6 + Postgres (Neon in production) · Vercel (project `founder-squared`, deploys `main`; builds run `prisma migrate deploy`). Background jobs (Inngest), Vercel Blob and the Claude API arrive with their tickets.

## Local setup

```bash
npm install                      # also runs `prisma generate`
cp .env.example .env             # set DATABASE_URL to a local Postgres
npx prisma migrate dev           # create the schema
npm run seed                     # load the demo data (Peter's agency)
npm run dev                      # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run seed` | Loads demo data into an empty database |
| `npm run seed:reset` | Wipes every table, then loads demo data |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Playwright smoke tests (needs a seeded database) |

### Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (pooled on Neon) |
| `DATABASE_URL_UNPOOLED` | Direct connection for migrations (same as `DATABASE_URL` locally) |

## Demo data

`npm run seed` creates Peter Hale, founder of Brightside Digital (`brightside.agency`), with:

- an approved business context profile
- habits H1–H14 and the account manager path
- 12 founder calls and 6 rep calls (Sam Okafor) with synthetic transcripts, moments and scorecards; every call plays `public/demo/sample-call.mp4`
- 29 playbook items (25 live, some proven, 4 filtered with reasons)
- 5 inbox items, 4 opportunities (one won), 6 placeholder founder clips
- rep progress: baseline 46, focus habit H13 at 3 of 4, H5 mastered

Report sample numbers live in `src/lib/demo/report-samples.ts`.

## Conventions

- Screens for the founder live under `/founder/*`, rep screens under `/rep/*`. The header switch persists the view on the user.
- `ComingSoon` marks deliberate MVP placeholders; `LaterLine` is the single muted line for later features; `UnderConstruction` is a temporary stub until a screen's ticket lands.
- Habits are seed data only; app logic must not hard-code habit codes.
