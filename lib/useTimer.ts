"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Phase, WorkoutConfig } from "./types";
import { buildPhases } from "./timerEngine";
import type { AudioEngine } from "./audio";

export type TimerState = {
  phase: Phase | null;
  remaining: number;
  phaseIndex: number;
  done: boolean;
  paused: boolean;
  elapsed: number;
};

export function useTimer(
  config: Pick<WorkoutConfig, "preparation" | "rounds" | "rest">,
  audio: AudioEngine,
) {
  const phases = useMemo(() => buildPhases(config), [config]);
  const totalDuration = useMemo(
    () => phases.reduce((a, p) => a + p.duration, 0),
    [phases],
  );

  const [state, setState] = useState<TimerState>({
    phase: phases[0] ?? null,
    remaining: phases[0]?.duration ?? 0,
    phaseIndex: 0,
    done: phases.length === 0,
    paused: false,
    elapsed: 0,
  });

  const raf = useRef<number | null>(null);
  const phaseIndex = useRef(0);
  const phaseStart = useRef<number>(0); // performance.now() when current phase started
  const pausedAt = useRef<number | null>(null);
  const lastBeepSecond = useRef<number>(-1);
  const elapsedBefore = useRef<number>(0); // sum of durations of completed phases

  const startPhase = useCallback(
    (index: number, now: number) => {
      phaseIndex.current = index;
      phaseStart.current = now;
      lastBeepSecond.current = -1;
      const p = phases[index];
      if (!p) return;
      if (p.kind === "rest") audio.doubleBeep();
      else audio.bell(); // prep or round
    },
    [phases, audio],
  );

  useEffect(() => {
    if (phases.length === 0) return;
    let mounted = true;
    const begin = performance.now();
    phaseStart.current = begin;
    elapsedBefore.current = 0;
    startPhase(0, begin);

    const tick = (now: number) => {
      if (!mounted) return;
      if (pausedAt.current !== null) {
        raf.current = requestAnimationFrame(tick);
        return;
      }
      const p = phases[phaseIndex.current];
      const phaseElapsed = (now - phaseStart.current) / 1000;
      const remainingSec = p.duration - phaseElapsed;
      const remainingCeil = Math.max(0, Math.ceil(remainingSec));

      // last-3-seconds countdown beep, once per whole second (3,2,1)
      if (remainingCeil <= 3 && remainingCeil >= 1 && lastBeepSecond.current !== remainingCeil) {
        lastBeepSecond.current = remainingCeil;
        audio.countdownBeep();
      }

      if (remainingSec <= 0) {
        const next = phaseIndex.current + 1;
        elapsedBefore.current += p.duration;
        if (next >= phases.length) {
          audio.tripleBell();
          setState((s) => ({ ...s, done: true, remaining: 0, elapsed: totalDuration }));
          return; // stop loop
        }
        startPhase(next, now);
        setState({
          phase: phases[next],
          remaining: phases[next].duration,
          phaseIndex: next,
          done: false,
          paused: false,
          elapsed: elapsedBefore.current,
        });
      } else {
        setState((s) => ({
          ...s,
          phase: p,
          phaseIndex: phaseIndex.current,
          remaining: remainingCeil,
          elapsed: elapsedBefore.current + phaseElapsed,
        }));
      }
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
    // Re-run only when the phase list identity changes (new config / restart key).
  }, [phases, totalDuration, startPhase, audio]);

  const togglePause = useCallback(() => {
    setState((s) => {
      const willPause = !s.paused;
      const now = performance.now();
      if (willPause) {
        pausedAt.current = now;
      } else if (pausedAt.current !== null) {
        // shift phaseStart forward by the paused duration
        phaseStart.current += now - pausedAt.current;
        pausedAt.current = null;
      }
      return { ...s, paused: willPause };
    });
  }, []);

  // restart is implemented by the caller remounting via a key; expose a no-op-safe stub
  const restart = useCallback(() => {
    // Caller should change the component key to remount; see TimerScreen usage.
  }, []);

  return { state, togglePause, restart };
}
