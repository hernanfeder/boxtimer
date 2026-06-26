# BoxTimer — Audio & Flow Changes Design

**Date:** 2026-06-26
**Status:** Approved — implementing directly (modest scope, 5 files)

## Originating request (post-launch feedback)

1. Don't speak the parsed workout back; just show it on screen a bit bigger, then confirm.
2. Move "save this config" to **after** the workout ends: Record → Confirm → run rounds → offer to save.
3. The exercise-start sound must differ from the other sounds.
4. Round begin = boxing bell; round end = boxing bell; the two slightly different.
5. A different sound for the end of the exercise.

## Decisions (confirmed)

- Save offer appears on the Done screen **only for voice-created workouts**; workouts launched from an already-saved card don't re-offer. After saving once, it isn't offered again.
- Keep the 3-2-1 countdown beeps in the last 3 seconds of each phase. Rest gets no dedicated sound — bracketed by the round-end and round-begin bells.

## Flow changes

**VoiceConfigScreen**
- Remove the `SpeechSynthesis` readback (`speak`/`buildReadback`).
- Review stage shows the parsed config **larger**: round count, prep/rest line, and a per-round list at a bigger font, with `[Start]` and `[Re-record]`.
- Remove the `naming` stage. `Start` resumes audio and calls `onStart(parsed)` → straight to the timer.

**RootApp**
- Track `saveable: ActiveConfig | null`. Voice `onStart(c)` sets it; card `onSelectConfig` clears it (already saved); `goHome` clears it.
- Pass `canSave={saveable !== null}` and `onSave(name)` (calls `persistConfig(saveable, name)` then clears `saveable`) to DoneScreen.

**DoneScreen**
- New props `canSave: boolean`, `onSave: (name: string) => void`.
- When `canSave` and not yet saved: show an optional name input + Save button above Repeat/Home. After save: show "Saved ✓". Repeat/Home always present.

## Audio scheme (synthesized; bells layer inharmonic partials for a metallic ring)

A private `bellStrike(freq, peak, duration, at)` plays `freq` + `2.0×freq` + `2.96×freq` partials with exponential decay.

| Event | Method | Definition |
|---|---|---|
| Exercise start (prep/"Get Ready" begins) | `startSignal()` | Rising tones 523→659→784 Hz, ~0.16s each (not a bell) |
| Round begins | `roundStartBell()` | Single `bellStrike(880, 0.85, 1.0)` |
| Round ends | `roundEndBell()` | Two `bellStrike(740, 0.8, 0.45)` 0.18s apart ("ding-ding") |
| Last 3 s of any phase | `countdownBeep()` | 600 Hz, 0.1s (unchanged) |
| Exercise ends | `finishSignal()` | Ascending fanfare 660→880→1175 Hz bell strikes, last rings ~1.4s |

Old `bell()` / `doubleBeep()` / `tripleBell()` are replaced by the methods above.

## useTimer cue-triggering (moved to phase boundaries)

`startPhase` no longer plays sound (just sets refs). Cue logic:
- On entering phase 0 (workout start): `startSignal()`.
- On a phase boundary where the workout is **not** finished: if the **ending** phase is a round → `roundEndBell()`; if the **starting** phase is a round → `roundStartBell()`. (Rest → no sound; prep→round1 plays only the begin bell.)
- On completion (last phase ends): `finishSignal()` instead of a round-end bell.
- Countdown beeps unchanged (last 3 whole seconds of each phase).

Edge: with `preparation = 0`, phase 0 is round 1, so the start chime stands in for round 1's begin bell (round 1 still gets its end bell unless it's the only/last round, which plays the finish fanfare).

## Files

- `lib/audio.ts` — replace cue methods; add `bellStrike` helper.
- `lib/useTimer.ts` — move cue triggering to boundaries; `startPhase` becomes sound-free.
- `components/VoiceConfigScreen.tsx` — remove readback + naming stage; enlarge review.
- `components/DoneScreen.tsx` — optional save control.
- `components/RootApp.tsx` — `saveable` tracking; wire Done save.

## Verification

`pnpm test` (existing 18 unit tests still pass — no test asserts audio method names, but timerEngine/storage/schema unchanged), `pnpm typecheck`, `pnpm build`. Manual: voice flow shows bigger config + no speech; sounds distinct; save appears only after a voice workout.

## Out of scope

Voice "modify existing config" (currentConfig) UI; configurable sounds; other open follow-ups in progress.json.
