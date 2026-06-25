import type { ParsedWorkout, WorkoutConfig } from "./types";
import { parseWorkoutResult } from "./schema";

export async function parseWorkout(
  transcript: string,
  currentConfig?: WorkoutConfig,
): Promise<ParsedWorkout> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch("/api/parse-workout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, currentConfig }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error("parse failed");
    const data = await res.json();
    return parseWorkoutResult(data); // re-validate client-side
  } finally {
    clearTimeout(timeout);
  }
}
