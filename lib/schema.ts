import { z } from "zod";
import type { ParsedWorkout } from "./types";

export const parsedWorkoutSchema = z.object({
  preparation: z.number().int().min(0).max(3600),
  rounds: z.array(z.number().int().min(1).max(3600)).min(1).max(50),
  rest: z.number().int().min(0).max(3600),
});

export function parseWorkoutResult(data: unknown): ParsedWorkout {
  return parsedWorkoutSchema.parse(data);
}
