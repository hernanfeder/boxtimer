import { z } from "zod";
import type { ParsedWorkout } from "./types";

export const parsedWorkoutSchema = z.object({
  preparation: z.number().int().min(0).max(3600),
  rounds: z.array(z.number().int().min(1).max(3600)).min(1).max(50),
  rest: z.number().int().min(0).max(3600),
});

export const workoutConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  preparation: z.number().int().min(0).max(3600),
  rounds: z.array(z.number().int().min(1).max(3600)).min(1).max(50),
  rest: z.number().int().min(0).max(3600),
  createdAt: z.string().min(1),
});

export function parseWorkoutResult(data: unknown): ParsedWorkout {
  return parsedWorkoutSchema.parse(data);
}
