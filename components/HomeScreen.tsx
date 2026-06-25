"use client";

import { useEffect, useState } from "react";
import type { WorkoutConfig } from "@/lib/types";
import { loadConfigs, deleteConfig, formatSummary } from "@/lib/storage";
import { Button } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";

type Props = {
  onNewWorkout: () => void;
  onSelectConfig: (c: WorkoutConfig) => void;
};

export function HomeScreen({ onNewWorkout, onSelectConfig }: Props) {
  const [configs, setConfigs] = useState<WorkoutConfig[]>([]);
  const [pendingDelete, setPendingDelete] = useState<WorkoutConfig | null>(null);

  useEffect(() => {
    setConfigs(loadConfigs());
  }, []);

  const handleDelete = () => {
    if (!pendingDelete) return;
    deleteConfig(pendingDelete.id);
    setConfigs(loadConfigs());
    setPendingDelete(null);
  };

  // long-press detection
  let pressTimer: ReturnType<typeof setTimeout> | null = null;
  const startPress = (c: WorkoutConfig) => {
    pressTimer = setTimeout(() => setPendingDelete(c), 600);
  };
  const endPress = () => {
    if (pressTimer) clearTimeout(pressTimer);
    pressTimer = null;
  };

  return (
    <main className="flex min-h-dvh flex-col bg-white p-6 text-brand-navy">
      <h1 className="mb-8 mt-4 text-center text-4xl font-extrabold">BoxTimer</h1>

      <Button className="w-full" onClick={onNewWorkout}>
        New Workout
      </Button>

      <h2 className="mb-3 mt-8 text-xl font-bold">Saved Configurations</h2>

      {configs.length === 0 ? (
        <p className="mt-8 text-center text-brand-navy/60">No saved workouts yet</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {configs.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => onSelectConfig(c)}
                onPointerDown={() => startPress(c)}
                onPointerUp={endPress}
                onPointerLeave={endPress}
                className="w-full rounded-xl border-2 border-brand-navy bg-white p-4 text-left text-brand-navy active:opacity-80"
              >
                <div className="text-lg font-bold">{c.name}</div>
                <div className="text-sm text-brand-navy/70">{formatSummary(c)}</div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        message={`Delete "${pendingDelete?.name}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </main>
  );
}
