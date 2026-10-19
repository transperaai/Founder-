#!/usr/bin/env bash
# Vercel build: migrate, seed demo data into an empty database in demo mode, build.
set -euo pipefail
npx prisma migrate deploy
if [ "${DEMO_MODE:-}" = "true" ]; then
  npm run seed
fi
npx next build
