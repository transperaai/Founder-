# Founder²

Internal MVP: captures how an agency founder sells from their Fathom calls, builds a playbook, and coaches reps against it. The product spec is [issue #1](https://github.com/transperaai/Founder-/issues/1); work is tracked as its sub-issues.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind 4 · shadcn/ui (Base UI) · Prisma 6 + Postgres (Neon in production) · Vercel (project `founder-squared`, deploys `main`; builds run `prisma migrate deploy`). Claude API (`claude-sonnet-5-5`) for analysis. Inngest for background jobs. Vercel Blob for media (arrives with #7).

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
| `npm test` | Unit tests, plus database tests (`*.db.test.ts`) against `founder_test` (Vitest) |
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
| `FATHOM_API_KEY` | Default Fathom key for the deployment (Vercel only). A key saved in Settings → Connect Fathom wins over it |
| `FATHOM_API_BASE_URL` | Override the Fathom API base (tests point it at `tests/fake-fathom`). Defaults to `https://api.fathom.ai/external/v1` |
| `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` | Inngest Cloud keys (set by the Vercel integration). Without them, analysis runs in-process after the response |
| `INNGEST_DEV` | `1` to send jobs to a local Inngest dev server (`npx inngest-cli@latest dev`) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token (set by the Blob integration); used to store and delete call media |
| `TEST_DATABASE_URL` | Database for `*.db.test.ts`. Defaults to `DATABASE_URL` with the database renamed `founder_test`; it is migrated and truncated by the tests |
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

## Fathom

- **Connect:** Settings → Connect Fathom (or onboarding step 2). The pasted key is checked with `GET /meetings` and stored encrypted only if Fathom accepts it. Key order: saved key, then `FATHOM_API_KEY` unless the founder disconnected (`fathomUseDefaultKey`).
- **Import:** Calls → Import from Fathom (or onboarding step 6) lists meetings a page at a time (`next_cursor`). Only ticked meetings become Calls (`importing`, role founder); a recording already imported is marked and never duplicated (`fathomRecordingId` is unique).
- **Job:** `call/import.requested` fetches `GET /recordings/{id}/transcript` (throttled to 25/min, under Fathom's 30/min for heavy requests; 429s retry after `Retry-After`), stores normalised turns (each turn ends where the next starts), then emits `call/imported` (media copy, #7) and `call/analyse.requested`.
- Retry on a Fathom call with no transcript re-runs the import; otherwise it re-runs analysis.
- `src/lib/fathom/client.ts` is tested against `tests/fake-fathom` (fixtures in `fixtures.json`), which Playwright also runs on port 3101.

## Analysis pipeline

`analyseCall(callId)` in `src/lib/pipeline` is the single entry point: normalise → classify → segment into moments, then (later tickets) the founder or rep path. Each stage is idempotent (moments are replaced, never appended), so re-running a call is safe.

- Status flows `importing → analysing → ready | skipped | error`. Failures store a message safe to show, and the calls table offers Retry.
- A call whose attendees all share the founder's email domain is `internal` and skipped without a model call. Otherwise the model classifies it from the first 10 minutes.
- Overriding the call type in the table sets `callTypeOverridden` and re-runs the pipeline with the founder's choice.
- `requestAnalysis(callIds)` queues work: an Inngest event (`call/analyse.requested`, one `step.run` per stage, concurrency 1 per call) when Inngest is configured, otherwise in-process via `after()`.
- Pipeline tests run fixture calls (`tests/fixtures/calls`) through `analyseCall` with `fakeClaude`, against the test database.

## Conventions

- Screens for the founder live under `/founder/*`, rep screens under `/rep/*`. The header switch persists the view on the user.
- `ComingSoon` marks deliberate MVP placeholders; `LaterLine` is the single muted line for later features; `UnderConstruction` is a temporary stub until a screen's ticket lands.
- Habits are seed data only; app logic must not hard-code habit codes.
