# BoxTimer — Project Instructions

## Originating prompt

> Build a mobile-first PWA interval timer app for Android Chrome called "BoxTimer".
>
> STACK: Next.js 14 (App Router), TypeScript, Tailwind CSS. No backend, no
> database, no auth. All state in memory + localStorage. Deploy target: Vercel.
>
> (Full spec: color system, WorkoutConfig data model, Home / Voice Config /
> Timer / Done screens, synthesized Web Audio cues, Wake Lock, Web Speech voice
> capture + readback, an `/api/parse-workout` route calling Anthropic
> `claude-haiku-4-5-20251001` to parse spoken descriptions into a WorkoutConfig,
> a 20-item localStorage store, PWA manifest, and required `ANTHROPIC_API_KEY`
> env var with `.env.local.example` + README + user_guide.)

The approved design lives in
[docs/superpowers/specs/2026-06-25-boxtimer-design.md](docs/superpowers/specs/2026-06-25-boxtimer-design.md).

## Key conventions

- Brand colors are Tailwind theme tokens; never hardcode hex in components.
- `ANTHROPIC_API_KEY` is server-only — never imported into client code.
- The LLM model is pinned to `claude-haiku-4-5-20251001`.
- The parse route uses Anthropic structured outputs + zod validation.
- Web Speech / Web Audio / Wake Lock are feature-detected and degrade silently.
