"use client";

import { formatDuration } from "@/lib/storage";

type Props = {
  elapsed: number;
  onRepeat: () => void;
  onHome: () => void;
};

export function DoneScreen({ elapsed, onRepeat, onHome }: Props) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-brand-navy p-6 text-white">
      <h1 className="mb-4 text-center text-4xl font-extrabold">Workout Complete! 💪</h1>
      <p className="mb-10 text-xl">Total time: {formatDuration(elapsed)}</p>
      <div className="flex w-full max-w-sm flex-col gap-3">
        <button
          onClick={onRepeat}
          className="rounded-xl bg-white px-6 py-4 text-lg font-semibold text-brand-navy active:opacity-80"
        >
          Repeat
        </button>
        <button
          onClick={onHome}
          className="rounded-xl bg-white px-6 py-4 text-lg font-semibold text-brand-navy active:opacity-80"
        >
          Home
        </button>
      </div>
    </main>
  );
}
