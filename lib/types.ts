export type WorkoutConfig = {
  id: string;
  name: string;
  preparation: number;
  rounds: number[];
  rest: number;
  createdAt: string;
};

export type ParsedWorkout = Pick<WorkoutConfig, "preparation" | "rounds" | "rest">;

export type Screen = "home" | "voice" | "timer" | "done";

export type PhaseKind = "prep" | "round" | "rest";

export type Phase = {
  kind: PhaseKind;
  duration: number; // seconds
  roundIndex: number; // 0-based for round/rest; -1 for prep
  totalRounds: number;
};
