import type { Phase, WorkoutConfig } from "./types";

export function buildPhases(
  config: Pick<WorkoutConfig, "preparation" | "rounds" | "rest">,
): Phase[] {
  const { preparation, rounds, rest } = config;
  const totalRounds = rounds.length;
  const phases: Phase[] = [];

  if (preparation > 0) {
    phases.push({ kind: "prep", duration: preparation, roundIndex: -1, totalRounds });
  }

  rounds.forEach((duration, i) => {
    phases.push({ kind: "round", duration, roundIndex: i, totalRounds });
    const isLast = i === rounds.length - 1;
    if (!isLast && rest > 0) {
      phases.push({ kind: "rest", duration: rest, roundIndex: i + 1, totalRounds });
    }
  });

  return phases;
}
