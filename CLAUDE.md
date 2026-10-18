# Founder²

Internal MVP of Founder²: captures how an agency founder sells (from their Fathom calls), builds a playbook, and coaches reps against it. One deployment per organisation; the founder is the only real account and switches between Founder view and Rep view.

The product spec is the parent spec issue on GitHub (label `spec`); tickets are its sub-issues.

## Stack

- Next.js (App Router), TypeScript, Tailwind, shadcn/ui — hosted on Vercel
- Neon Postgres + Prisma
- Auth.js (Google + Microsoft Entra ID, with calendar read scopes)
- Inngest for background jobs and scheduled polls
- Vercel Blob for recordings and uploads
- Claude API for every analysis step (structured JSON outputs, prompts in versioned files)
- Speech-to-text is deferred: MVP accepts text transcripts (.txt/.vtt/.srt) and typed answers only

## Agent skills

### Issue tracker

Issues and specs are GitHub issues in `transperaai/founder-` (`gh` CLI, or GitHub MCP tools when `gh` is unavailable). See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root (created lazily). See `docs/agents/domain.md`.

Skills are vendored from [mattpocock/skills](https://github.com/mattpocock/skills) (MIT) under `.claude/skills/`.
