"use client";

import { useState } from "react";
import { formatDuration } from "@/lib/storage";

type Props = {
  elapsed: number;
  canSave: boolean;
  onSave: (name: string) => void;
  onRepeat: () => void;
  onHome: () => void;
};

export function DoneScreen({ elapsed, canSave, onSave, onRepeat, onHome }: Props) {
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave(name);
    setSaved(true);
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-brand-navy p-6 text-white">
      <h1 className="mb-4 text-center text-4xl font-extrabold">Workout Complete! 💪</h1>
      <p className="mb-8 text-xl">Total time: {formatDuration(elapsed)}</p>

      {canSave && !saved && (
        <div className="mb-8 flex w-full max-w-sm flex-col gap-3">
          <label htmlFor="workout-name" className="text-center text-lg font-medium">
            Save this workout? (optional name)
          </label>
          <input
            id="workout-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Boxing Bag"
            className="rounded-xl bg-white px-4 py-3 text-brand-navy"
          />
          <button
            onClick={handleSave}
            className="rounded-xl bg-white px-6 py-4 text-lg font-semibold text-brand-navy active:opacity-80"
          >
            Save
          </button>
        </div>
      )}

      {saved && <p className="mb-8 text-lg font-medium">Saved ✓</p>}

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
