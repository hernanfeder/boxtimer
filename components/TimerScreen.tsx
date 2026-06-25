"use client";

import { useEffect, useState } from "react";
import type { WorkoutConfig } from "@/lib/types";
import { useTimer } from "@/lib/useTimer";
import { useWakeLock } from "@/lib/useWakeLock";
import type { AudioEngine } from "@/lib/audio";
import { formatClock } from "@/lib/storage";
import { ConfirmDialog } from "./ConfirmDialog";

type Props = {
  config: Pick<WorkoutConfig, "preparation" | "rounds" | "rest">;
  audio: AudioEngine;
  onStop: () => void;
  onDone: (elapsed: number) => void;
};

const PHASE_BG: Record<string, string> = {
  prep: "bg-brand-navy",
  round: "bg-brand-green",
  rest: "bg-brand-red",
};

export function TimerScreen({ config, audio, onStop, onDone }: Props) {
  const { state, togglePause } = useTimer(config, audio);
  const { isActive } = useWakeLock(true);
  const [confirmStop, setConfirmStop] = useState(false);

  useEffect(() => {
    if (state.done) onDone(Math.round(state.elapsed));
  }, [state.done, state.elapsed, onDone]);

  if (state.done || !state.phase) {
    return <div className="min-h-dvh bg-brand-navy" />; // brief frame before Done screen
  }

  const phase = state.phase;
  const bg = PHASE_BG[phase.kind];

  return (
    <main
      onClick={() => {
        if (!confirmStop) togglePause();
      }}
      className={`relative flex min-h-dvh flex-col items-center justify-center text-white ${bg}`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setConfirmStop(true);
        }}
        aria-label="Stop workout"
        className="absolute right-4 top-4 text-3xl leading-none"
      >
        ✕
      </button>

      {isActive && (
        <span className="absolute left-4 top-4 text-xl" title="Screen stays on" aria-label="Screen stays on">
          🔆
        </span>
      )}

      {phase.kind === "prep" && <div className="mb-4 text-3xl font-bold">Get Ready</div>}
      {phase.kind === "round" && (
        <div className="mb-4 text-3xl font-bold">
          Round {phase.roundIndex + 1} of {phase.totalRounds}
        </div>
      )}
      {phase.kind === "rest" && <div className="mb-4 text-3xl font-bold">Rest</div>}

      <div className="text-[28vw] font-extrabold leading-none tabular-nums">
        {formatClock(state.remaining)}
      </div>

      {phase.kind === "round" && (
        <div className="mt-4 text-lg">Round duration: {formatClock(phase.duration)}</div>
      )}
      {phase.kind === "rest" && (
        <div className="mt-4 text-lg">
          Next: Round {phase.roundIndex + 1} of {phase.totalRounds}
        </div>
      )}

      {state.paused && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
          <div className="text-5xl font-extrabold">PAUSED</div>
          <div className="mt-2 text-lg">Tap anywhere to resume</div>
        </div>
      )}

      <ConfirmDialog
        open={confirmStop}
        message="Stop this workout and return home?"
        confirmLabel="Stop"
        onConfirm={() => {
          setConfirmStop(false);
          onStop();
        }}
        onCancel={() => setConfirmStop(false)}
      />
    </main>
  );
}
