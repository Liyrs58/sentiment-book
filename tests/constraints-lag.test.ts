import { describe, expect, it } from "vitest";
import { runBacktest } from "@/lib/backtest";
import { CONSTRAINTS, assertBook, project } from "@/lib/constraints";
import { ASSET_IDS } from "@/lib/assets";
import { allocate } from "@/lib/allocator";

describe("constraints and lag", () => {
  it("preserves long-only floor/cap/sum", () => {
    const snap = allocate({ month: "2025-05" });
    const w = assertBook(snap.superWeights);
    const sum = ASSET_IDS.reduce((a, id) => a + w[id], 0);
    expect(Math.abs(sum - 1)).toBeLessThan(1e-6);
    for (const id of ASSET_IDS) {
      expect(w[id]).toBeGreaterThanOrEqual(CONSTRAINTS.minWeight - 1e-9);
      expect(w[id]).toBeLessThanOrEqual(CONSTRAINTS.maxWeight + 1e-9);
    }
  });

  it("walk-forward rule documents one-month lag", () => {
    const bt = runBacktest("2025-05");
    expect(bt.rule).toMatch(/t\+1|returns_\{t\+1\}/);
    expect(CONSTRAINTS.decisionLagMonths).toBe(1);
    expect(bt.curve.length).toBeGreaterThan(3);
  });

  it("project is idempotent on simplex", () => {
    const raw = Object.fromEntries(ASSET_IDS.map((id, i) => [id, i === 0 ? 0.9 : 0.01]));
    const once = project(raw);
    const twice = project(once);
    for (const id of ASSET_IDS) {
      expect(Math.abs(once[id] - twice[id])).toBeLessThan(1e-9);
    }
  });
});
