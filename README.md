# BoxTimer

A mobile-first PWA interval timer for Android Chrome. Describe a workout by
voice; an LLM parses it into rounds/rests; a full-screen timer runs it with
synthesized audio cues and screen wake-lock. No backend, no database, no auth —
all state is in memory + localStorage. Deployed on Vercel.

## Tech stack

Next.js 14 (App Router), TypeScript, Tailwind CSS, zod, `@anthropic-ai/sdk`.

## Prerequisites

- Node.js 18.18+
- pnpm (`npm i -g pnpm`)
- An Anthropic API key

## Local setup

```bash
pnpm install
cp .env.local.example .env.local   # then edit .env.local
pnpm gen:icons                     # generates PWA icons into public/
pnpm dev                           # http://localhost:3000
```

Set `ANTHROPIC_API_KEY` in `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

## Scripts

- `pnpm dev` — dev server
- `pnpm build` / `pnpm start` — production build / serve
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm test` — unit tests (vitest)
- `pnpm gen:icons` — regenerate PWA icons

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, "New Project" → import the repo. Framework preset: Next.js.
3. **Add the environment variable** before deploying:
   - Project → Settings → Environment Variables
   - Name: `ANTHROPIC_API_KEY`, Value: your key
   - Environments: Production (and Preview if desired)
4. Deploy. The `/api/parse-workout` route reads the key server-side; it is never
   exposed to the client.

## Notes

- Voice input uses the Web Speech API, best supported in Chrome on Android.
- Audio, Wake Lock, and Speech are feature-detected and degrade gracefully.
