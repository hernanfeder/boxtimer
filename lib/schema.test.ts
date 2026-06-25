import { describe, it, expect } from "vitest";
import { parseWorkoutResult } from "./schema";

describe("parseWorkoutResult", () => {
  it("accepts a valid parsed workout", () => {
    const r = parseWorkoutResult({ preparation: 10, rounds: [30, 30, 20], rest: 15 });
    expect(r).toEqual({ preparation: 10, rounds: [30, 30, 20], rest: 15 });
  });

  it("rejects empty rounds", () => {
    expect(() => parseWorkoutResult({ preparation: 10, rounds: [], rest: 15 })).toThrow();
  });

  it("rejects non-integer round durations", () => {
    expect(() => parseWorkoutResult({ preparation: 10, rounds: [30.5], rest: 15 })).toThrow();
  });

  it("rejects rounds shorter than 1 second", () => {
    expect(() => parseWorkoutResult({ preparation: 10, rounds: [0], rest: 15 })).toThrow();
  });

  it("rejects missing fields", () => {
    expect(() => parseWorkoutResult({ rounds: [30] })).toThrow();
  });
});
