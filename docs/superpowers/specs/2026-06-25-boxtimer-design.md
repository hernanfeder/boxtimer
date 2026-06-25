# BoxTimer — Design Spec

**Date:** 2026-06-25
**Status:** Approved — ready for implementation plan

## 1. Summary

A mobile-first PWA interval timer for Android Chrome called **BoxTimer**. Users
describe a workout by voice; an LLM parses it into a structured config; a
full-screen timer runs preparation → rounds → rests with synthesized audio cues
and screen-wake-lock. No backend, no database, no auth. All state in memory +
localStorage. Single server route for LLM parsing. Deploy target: Vercel.

## 2. Stack & constraints

- Next.js 14 (App Router), TypeScript (strict), Tailwind CSS.
- Package manager: pnpm.
- Validation: zod at the API boundary.
- AI: `@anthropic-ai/sdk`, model `claude-haiku-4-5-20251001`.
- PWA: installable manifest **plus** a service worker caching the app shell, so
  UI / timer / audio work fully offline. Only `/api/parse-workout` needs network.
- App icons (192/512 PNG) generated at setup time by a `sharp` script.
- Verification before handoff: `next build` + `tsc --noEmit`. The live Anthropic
  API is not called during verification (requires the user's key).

## 3. Color system (authoritative)

| State                | Background | Text / Icons |
|----------------------|-----------|--------------|
| Home / Voice Config  | `#FFFFFF` | `#1E3A5F`    |
| Preparation phase    | `#1E3A5F` | `#FFFFFF`    |
| Round phase (active) | `#166534` | `#FFFFFF`    |
| Rest phase           | `#991B1B` | `#FFFFFF`    |
| Done screen          | `#1E3A5F` | `#FFFFFF`    |

- Primary buttons: `#1E3A5F` bg, `#FFFFFF` text.
- Mic button: `#1E3A5F` bg, white mic icon.
- Saved config cards: `#FFFFFF` bg, `#1E3A5F` border + text.

Defined once as Tailwind theme tokens (`brand.navy #1E3A5F`, `brand.green
#166534`, `brand.red #991B1B`) and reused everywhere.

## 4. Data model

```ts
type WorkoutConfig = {
  id: string          // crypto.randomUUID()
  name: string
  preparation: number // seconds before round 1
  rounds: number[]    // per-round durations in seconds, e.g. [30,30,30,40,20]
  rest: number        // seconds between rounds
  createdAt: string   // ISO string
}
```

The API returns only `{ preparation, rounds, rest }`; `id`, `name`, `createdAt`
are assigned client-side at save time.

## 5. Architecture

State-driven single-page flow (no URL routing). The root client component holds
`{ screen, activeConfig }` and renders one of four screens. Rationale: the timer
must survive without navigation, and Wake Lock + Web Audio need a continuous
component tree across phase transitions.

```
RootApp (client)
 ├─ HomeScreen          (white)
 ├─ VoiceConfigScreen   (white)  → POST /api/parse-workout
 ├─ TimerScreen         (navy/green/red per phase)
 └─ DoneScreen          (navy)
```

### Module boundaries

| Module | Responsibility |
|---|---|
| `lib/types.ts` | `WorkoutConfig`, `Phase` union, screen enum |
| `lib/storage.ts` | localStorage CRUD under key `boxtimer_configs`; 20-cap (evict oldest); `crypto.randomUUID`; summary formatter (`"5 rounds · 15s rest · 3m 45s total"`) |
| `lib/audio.ts` | `AudioEngine` using `OscillatorNode`: bell, double-beep, countdown beep, triple bell. Lazily creates `AudioContext` on first user gesture. |
| `lib/useWakeLock.ts` | Acquire on timer entry; re-acquire on `visibilitychange`; release on unmount |
| `lib/useSpeech.ts` | `SpeechRecognition` (webkit-prefixed) live transcript; `SpeechSynthesis` readback |
| `lib/timerEngine.ts` + `useTimer.ts` | Build phase sequence from config; drive countdown via `requestAnimationFrame` + timestamp deltas (drift-free); fire audio callbacks; pause/resume; report elapsed |
| `app/api/parse-workout/route.ts` | Anthropic call with structured output + zod validation; 400 on failure |
| `components/*` | Four screens + shared button/card primitives |

## 6. Audio (Web Audio API, synthesized — no files)

- **Prep end / round start** — boxing bell: `OscillatorNode` sine, 800 Hz,
  exponential gain decay over 1.5 s, peak gain 0.8.
- **Rest start** — two beeps: 400 Hz, 0.15 s each, 0.2 s apart, gain 0.6.
- **Last 3 s of any phase** — one short beep per second: 600 Hz, 0.1 s, gain 0.5.
- **Workout complete** — triple bell: three 800 Hz bells, 0.5 s apart.

`AudioContext` is created/resumed on the first user interaction (Start tap) to
satisfy mobile autoplay policy.

## 7. Timer engine

Phase sequence computed once from a config:
`PREPARATION → ROUND 0 → REST → ROUND 1 → REST → … → ROUND last → DONE`
(no trailing rest after the final round).

A single `requestAnimationFrame` loop tracks `performance.now()` deltas so the
countdown does not drift and tolerates background throttling. Transitions trigger
the appropriate audio cue; the last-3-second ticks trigger the countdown beep.
Pause freezes the accumulator; resume continues from the frozen remaining time.

### Screens

- **Preparation:** navy bg, "Get Ready", giant MM:SS, no round indicator.
- **Round:** green bg, "Round N of M" top, giant MM:SS, "Round duration: …" below.
- **Rest:** red bg, "Rest", giant MM:SS, "Next: Round N of M".
- **Done:** navy bg, "Workout Complete! 💪", total elapsed, [Repeat] [Home]
  (white bg, navy text).

### Controls (all phases except Done)

- Tap anywhere = pause/resume.
- Top-right "✕" = stop → Home (with confirmation dialog).
- Paused state shows a "PAUSED" overlay with a resume hint.

## 8. LLM voice parsing

`POST /api/parse-workout`

- **Receives:** `{ transcript: string, currentConfig?: WorkoutConfig }`.
- **Model:** `claude-haiku-4-5-20251001`; key from
  `process.env.ANTHROPIC_API_KEY` (never sent to client).
- **System prompt** (verbatim from requirements): instructs the model to extract
  a `{ preparation, rounds, rest }` JSON object, handle word numbers and relative
  references, treat `currentConfig` as a modification command, and make
  reasonable assumptions when ambiguous.
- **Structured output:** request uses `output_config.format` with a JSON schema
  for `{ preparation: int, rounds: int[], rest: int }` so the response is
  guaranteed parseable JSON (no markdown fences). The result is additionally
  zod-validated server-side.
- **On success:** returns the three fields.
- **On failure / invalid output:** 400 `{ error: 'Could not parse workout' }`.

### Client behavior

- Live transcript shown while speaking (blue text).
- On stop: spinner "Parsing…" during the request.
- 10 s timeout via `AbortController`; any error resets to the mic button and
  shows "Couldn't understand that, please try again".
- On success: `SpeechSynthesis` reads back the full config and the summary is
  shown on screen simultaneously. Buttons: [Start] [Re-record].
- Start → small name input with [Save] [Skip]. Save → store + go to Timer.
  Skip → go to Timer directly.

## 9. Saved configurations

- localStorage key `boxtimer_configs`, value `WorkoutConfig[]`.
- Max 20; oldest evicted first when the limit is reached.
- Home lists each as a card (name + summary line). Tap → load + go to Timer.
  Long-press → delete confirmation dialog. Empty state: "No saved workouts yet".

## 10. PWA

`manifest.json`: name/short_name "BoxTimer", `theme_color`/`background_color`
`#1E3A5F`, `display: standalone`, `orientation: portrait`, icons 192 + 512.

HTML head: `viewport` with `viewport-fit=cover`, `mobile-web-app-capable`,
`apple-mobile-web-app-capable`.

Service worker caches the app shell (HTML/JS/CSS/icons) for offline use; the
parse API is network-only.

## 11. Environment & docs

- Required env var: `ANTHROPIC_API_KEY`.
- `.env.local.example` documents it.
- `README.md`: local setup, run, and adding `ANTHROPIC_API_KEY` to Vercel
  project settings.
- `user_guide.md`: how to install and use the app.

## 12. Feature detection / graceful degradation

Web Speech, Web Audio, and Wake Lock are all feature-detected. If unavailable,
the app degrades silently (e.g. no readback, no wake lock) without breaking the
core timer flow.

## 13. Out of scope (YAGNI)

No accounts, sync, history/stats, editing saved configs via UI (only create +
delete), no multiple workout templates beyond the 20-config store, no
internationalization, no light/dark theme toggle.
