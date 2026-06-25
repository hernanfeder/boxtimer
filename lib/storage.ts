import type { WorkoutConfig, ParsedWorkout } from "./types";
import { workoutConfigSchema } from "./schema";

const KEY = "boxtimer_configs";
const MAX = 20;

export function loadConfigs(): WorkoutConfig[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is WorkoutConfig => workoutConfigSchema.safeParse(item).success,
    );
  } catch {
    return [];
  }
}

function writeConfigs(configs: WorkoutConfig[]): void {
  localStorage.setItem(KEY, JSON.stringify(configs));
}

export function persistConfig(parsed: ParsedWorkout, name: string): WorkoutConfig {
  const config: WorkoutConfig = {
    id: crypto.randomUUID(),
    name: name.trim() || "Workout",
    preparation: parsed.preparation,
    rounds: parsed.rounds,
    rest: parsed.rest,
    createdAt: new Date().toISOString(),
  };
  const next = [...loadConfigs(), config];
  while (next.length > MAX) next.shift(); // evict oldest
  writeConfigs(next);
  return config;
}

export function deleteConfig(id: string): void {
  writeConfigs(loadConfigs().filter((c) => c.id !== id));
}

export function totalSeconds(
  c: Pick<WorkoutConfig, "preparation" | "rounds" | "rest">,
): number {
  const roundsTotal = c.rounds.reduce((a, b) => a + b, 0);
  const rests = c.rounds.length > 1 ? c.rest * (c.rounds.length - 1) : 0;
  return c.preparation + roundsTotal + rests;
}

export function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function formatClock(sec: number): string {
  const safe = Math.max(0, Math.floor(sec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatSummary(
  c: Pick<WorkoutConfig, "preparation" | "rounds" | "rest">,
): string {
  const n = c.rounds.length;
  return `${n} round${n === 1 ? "" : "s"} · ${c.rest}s rest · ${formatDuration(totalSeconds(c))} total`;
}
