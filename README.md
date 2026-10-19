# Founder²

Internal MVP: captures how an agency founder sells from their Fathom calls, builds a playbook, and coaches reps against it. The product spec is [issue #1](https://github.com/transperaai/Founder-/issues/1); work is tracked as its sub-issues.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind 4 · shadcn/ui (Base UI) · Prisma 6 + Postgres (Neon in production) · Vercel (project `founder-squared`, deploys `main`; builds run `prisma migrate deploy`). Claude API (`claude-sonnet-5-5`) for analysis. Background jobs (Inngest) and Vercel Blob arrive with their tickets.

## Local setup

```bash
npm install                      # also runs `prisma generate`
cp .env.example .env             # set DATABASE_URL to a local Postgres
npx prisma migrate dev           # create the schema
npm run seed                     # load the demo data (Peter's agency)
npm run dev                      # http://localhost:3000 (DEMO_MODE=true for demo sign-in)
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
| `AUTH_SECRET` | Auth.js session secret |
| `ENCRYPTION_KEY` | 32-byte base64 key; encrypts calendar tokens and API keys at rest |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google sign-in (requests `calendar.readonly`) |
| `AUTH_MICROSOFT_ENTRA_ID_ID` / `_SECRET` / `_ISSUER` | Microsoft sign-in (requests `Calendars.Read`) |
| `FOUNDER_EMAILS` | Extra emails allowed to sign in (the first user to sign in is always allowed) |
| `ANTHROPIC_API_KEY` | Claude API key for every AI step. Without it, AI steps report "not configured" and the UI falls back to manual entry |
| `DEMO_MODE` | `true` adds "Continue as the demo founder" and seeds demo data on Vercel builds. Never with real client data |

## Sign-in

Google and Microsoft only, with calendar read access requested in the same consent. Calendar access is optional: Google lets the founder untick it, and the app records whether it was granted. One organisation per deployment: the first person to sign in becomes the founder; after that only existing users and `FOUNDER_EMAILS` can sign in. First sign-in goes to `/onboarding`; returning users go to their view's home.

To register OAuth apps:

- **Google:** OAuth client (Web), redirect URI `https://<host>/api/auth/callback/google`; enable the Google Calendar API.
- **Microsoft:** Entra app registration, redirect URI `https://<host>/api/auth/callback/microsoft-entra-id`; delegated Graph permissions `User.Read`, `Calendars.Read`, `offline_access`.

## Demo data

`npm run seed` creates Peter Hale, founder of Brightside Digital (`brightside.agency`), with:

- an approved business context profile
- habits H1–H14 and the account manager path
- 12 founder calls and 6 rep calls (Sam Okafor) with synthetic transcripts, moments and scorecards; every call plays `public/demo/sample-call.mp4`
- 29 playbook items (25 live, some proven, 4 filtered with reasons)
- 5 inbox items, 4 opportunities (one won), 6 placeholder founder clips
- rep progress: baseline 46, focus habit H13 at 3 of 4, H5 mastered

Report sample numbers live in `src/lib/demo/report-samples.ts`.

## AI steps

Every AI step calls `runStep` in `src/lib/ai/harness.ts`:

- The prompt is a versioned module in `src/prompts/`. Bump its `version` when the text changes; outputs store `id@version`.
- Output is JSON constrained by a Zod schema (sent to the API as a JSON schema), validated, and retried once if invalid. Failures throw a typed `AiStepError` (`not_configured`, `invalid_output`, `refusal`, `api_error`).
- Token usage for every attempt is logged in `model_usages`, against the call when there is one.
- Refusals fall back server-side (`fallbacks: "default"`).
- Tests pass a fake `client`; nothing in the test suite calls the real API.

## Conventions

- Screens for the founder live under `/founder/*`, rep screens under `/rep/*`. The header switch persists the view on the user.
- `ComingSoon` marks deliberate MVP placeholders; `LaterLine` is the single muted line for later features; `UnderConstruction` is a temporary stub until a screen's ticket lands.
- Habits are seed data only; app logic must not hard-code habit codes.
