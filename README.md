# KONT — marketing site

Clean Next.js landing. Copy lives in `src/messages/en.json`.

## Environment (required)

`.env` is gitignored on purpose — it holds secrets (DB password, auth keys). Git only tracks the template: `.env.example`.

**Local**

```bash
cp .env.example .env
```

Then set at least:

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `AUTH_SECRET` | Random string for session cookies (generate: `openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` | YouTube OAuth (`…/api/youtube/oauth/callback`) |
| `GOOGLE_DRIVE_REDIRECT_URI` | Drive/Sheets/Calendar OAuth (`…/api/google-drive/oauth/callback`) |
| `META_APP_ID` / `META_APP_SECRET` / `META_REDIRECT_URI` | Facebook + Instagram OAuth (`…/api/meta/oauth/callback`). Optional `META_GRAPH_VERSION` (default `v21.0`). |

Start Postgres (local or hosted), then:

```bash
npx prisma migrate deploy
npx prisma generate
npm run dev
```

**Production — Vercel + Prisma Postgres**

Do not run `create-next-app` again. This repo is already the app. The official Prisma Postgres flow maps to these commands from the project root:

```bash
npx vercel login
npx vercel link
```

In the Vercel dashboard, create the database if it is not there yet: **Storage → Create Database → Prisma Postgres** (or Postgres). Attach it to this project so `DATABASE_URL` exists.

Also add `AUTH_SECRET` (Production + Preview):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Pull env onto the machine (this writes `.env.development.local`, gitignored):

```bash
npx vercel env pull .env.development.local
```

Apply the existing Prisma migrations to that remote DB (do **not** run `migrate dev --name init` — migrations are already in the repo):

```bash
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Deploy:

```bash
npx vercel deploy --prod
```

Git push to `main` also deploys if the GitHub project is connected. The build script runs `prisma migrate deploy && next build`.

## Build

```bash
npm run build
npm start
```

## Content

Edit `src/messages/en.json` for all user-facing strings. Add `ru.json` (etc.) and extend `src/i18n/messages.ts` when you need more locales.
