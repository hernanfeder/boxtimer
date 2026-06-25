import { describe, it, expect } from "vitest";
import { buildPhases } from "./timerEngine";

describe("buildPhases", () => {
  it("prep + 3 rounds with rests, no trailing rest", () => {
    const phases = buildPhases({ preparation: 10, rounds: [30, 40, 20], rest: 15 });
    expect(phases.map((p) => p.kind)).toEqual(["prep", "round", "rest", "round", "rest", "round"]);
    expect(phases[0]).toEqual({ kind: "prep", duration: 10, roundIndex: -1, totalRounds: 3 });
    expect(phases[1]).toEqual({ kind: "round", duration: 30, roundIndex: 0, totalRounds: 3 });
    expect(phases[2]).toEqual({ kind: "rest", duration: 15, roundIndex: 1, totalRounds: 3 });
    expect(phases[5]).toEqual({ kind: "round", duration: 20, roundIndex: 2, totalRounds: 3 });
  });

  it("skips prep when preparation is 0", () => {
    const phases = buildPhases({ preparation: 0, rounds: [30], rest: 15 });
    expect(phases.map((p) => p.kind)).toEqual(["round"]);
  });

  it("skips rests when rest is 0", () => {
    const phases = buildPhases({ preparation: 10, rounds: [30, 30], rest: 0 });
    expect(phases.map((p) => p.kind)).toEqual(["prep", "round", "round"]);
  });

  it("single round has no rest", () => {
    const phases = buildPhases({ preparation: 5, rounds: [60], rest: 15 });
    expect(phases.map((p) => p.kind)).toEqual(["prep", "round"]);
  });
});
