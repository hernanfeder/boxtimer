import { describe, it, expect, beforeEach } from "vitest";
import {
  loadConfigs,
  persistConfig,
  deleteConfig,
  totalSeconds,
  formatDuration,
  formatClock,
  formatSummary,
} from "./storage";

// jsdom-free localStorage stub
class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: Storage }).localStorage = new MemStorage() as unknown as Storage;
  let n = 0;
  Object.defineProperty(globalThis, "crypto", {
    value: {
      randomUUID: () => `id-${++n}` as `${string}-${string}-${string}-${string}-${string}`,
    },
    writable: true,
    configurable: true,
  });
});

describe("formatters", () => {
  it("totalSeconds = prep + rounds + rests between rounds", () => {
    expect(totalSeconds({ preparation: 30, rounds: [30, 30, 30, 40, 20], rest: 15 })).toBe(30 + 150 + 60);
  });
  it("formatDuration", () => {
    expect(formatDuration(225)).toBe("3m 45s");
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(60)).toBe("1m 0s");
  });
  it("formatClock zero-pads MM:SS", () => {
    expect(formatClock(5)).toBe("00:05");
    expect(formatClock(90)).toBe("01:30");
    expect(formatClock(0)).toBe("00:00");
  });
  it("formatSummary", () => {
    expect(formatSummary({ preparation: 30, rounds: [30, 30, 30, 40, 20], rest: 15 }))
      .toBe("5 rounds · 15s rest · 4m 0s total");
  });
});

describe("storage CRUD", () => {
  it("persists and loads", () => {
    const c = persistConfig({ preparation: 10, rounds: [30], rest: 5 }, "Test");
    expect(c.id).toBe("id-1");
    expect(c.name).toBe("Test");
    expect(loadConfigs()).toHaveLength(1);
  });
  it("deletes by id", () => {
    const c = persistConfig({ preparation: 10, rounds: [30], rest: 5 }, "Test");
    deleteConfig(c.id);
    expect(loadConfigs()).toHaveLength(0);
  });
  it("evicts oldest beyond 20", () => {
    for (let i = 0; i < 22; i++) persistConfig({ preparation: 10, rounds: [30], rest: 5 }, `W${i}`);
    const configs = loadConfigs();
    expect(configs).toHaveLength(20);
    expect(configs[0].name).toBe("W2"); // W0, W1 evicted
  });
  it("loadConfigs returns [] on corrupt data", () => {
    localStorage.setItem("boxtimer_configs", "not json");
    expect(loadConfigs()).toEqual([]);
  });
  it("drops malformed entries when loading", () => {
    const valid = {
      id: "id-x",
      name: "Valid",
      preparation: 10,
      rounds: [30],
      rest: 5,
      createdAt: "2026-06-25T00:00:00.000Z",
    };
    localStorage.setItem("boxtimer_configs", JSON.stringify([valid, { junk: true }, { rounds: [] }]));
    const configs = loadConfigs();
    expect(configs).toHaveLength(1);
    expect(configs[0].name).toBe("Valid");
  });
});
