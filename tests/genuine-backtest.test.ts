import { describe, expect, it } from "vitest";
import { runGenuineBacktest } from "@/lib/genuine-backtest";
import { loadRealEvents, loadRealPrices } from "@/lib/real-data";
import {
  articlesForAllocationMonth,
  assertNoFutureArticles,
  marketCutoffForMonth,
} from "@/lib/temporal";

describe("genuine-data research path", () => {
  it("loads REAL HISTORICAL price fixture for all 14 assets", () => {
    const prices = loadRealPrices();
    expect(prices.tapeKind).toBe("REAL_HISTORICAL_DATA");
    expect(Object.keys(prices.series).length).toBe(14);
  });

  it("events carry provenance and never use wire mastheads", () => {
    const events = loadRealEvents();
    expect(events.length).toBeGreaterThan(5);
    for (const e of events) {
      expect(["external", "manually-curated", "synthetic"]).toContain(e.sourceType);
      expect(["FT", "Reuters", "WSJ", "Bloomberg"]).not.toContain(e.source);
    }
  });

  it("temporal filter blocks future events in earlier months", () => {
    const events = loadRealEvents();
    const eligible = articlesForAllocationMonth(events, "2024-04");
    assertNoFutureArticles(eligible, marketCutoffForMonth("2024-04"));
    for (const e of eligible) {
      expect(e.date <= "2024-04-30").toBe(true);
    }
  });

  it("runs costed OOS backtest without fabricating FinBERT claims", () => {
    const r = runGenuineBacktest({ costBps: 10, oosStart: "2025-01" });
    expect(r.tapeKind).toBe("REAL_HISTORICAL_DATA");
    expect(r.months.length).toBeGreaterThan(5);
    expect(r.methodology.toLowerCase()).toMatch(/lexicon/);
    expect(r.methodology.toLowerCase()).not.toMatch(/finbert equivalent/);
    expect(Number.isFinite(r.strategy.totalReturn)).toBe(true);
    expect(r.avgTurnover).toBeGreaterThanOrEqual(0);
    expect(r.limitations.length).toBeGreaterThan(2);
  });
});
