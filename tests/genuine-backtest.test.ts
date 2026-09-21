import { describe, expect, it } from "vitest";
import { runGenuineBacktest, runGenuineBacktestFromData } from "@/lib/genuine-backtest";
import { ASSET_IDS } from "@/lib/assets";
import { loadRealEvents, loadRealPrices } from "@/lib/real-data";
import type { RealEventArticle, RealPriceBundle } from "@/lib/real-data";

describe("historical-input research path", () => {
  it("applies January sentiment to February returns, exactly one month later", () => {
    const months = ["2024-01", "2024-02", "2024-03"];
    const prices: RealPriceBundle = {
      sourceType: "synthetic",
      source: "test fixture",
      fetchedAt: "2024-04-01T00:00:00.000Z",
      series: Object.fromEntries(
        ASSET_IDS.map((id) => [
          id,
          {
            yahooSymbol: id,
            bars: months.map((month, i) => ({
              month,
              timestamp: Date.parse(`${month}-28T20:00:00.000Z`),
              close: id === "GSPC" && i > 0 ? 200 : 100,
            })),
          },
        ]),
      ),
    };
    const events: RealEventArticle[] = [
      {
        id: "jan-gspc-positive",
        date: "2024-01-30",
        timestamp: "2024-01-30T18:00:00.000Z",
        month: "2024-01",
        ticker: "GSPC",
        source: "Public test source",
        headline: "S&P surges",
        dek: "",
        desk: false,
        sourceType: "external",
        dataAsOf: "2024-01-30",
        generated: false,
      },
    ];
    const result = runGenuineBacktestFromData(prices, events, {
      costBps: 0,
      oosStart: "2024-02",
    });
    const costed = runGenuineBacktestFromData(prices, events, {
      costBps: 10,
      oosStart: "2024-02",
    });
    const feb = result.curve.find((point) => point.month === "2024-02")!;
    expect(result.provenance).toEqual({
      prices: {
        sourceType: "synthetic",
        source: "test fixture",
        fetchedAt: "2024-04-01T00:00:00.000Z",
      },
      events: { synthetic: 0, external: 1, "manually-curated": 0 },
    });
    expect(feb.strategy).toBeGreaterThan(feb.equal);
    expect(costed.totalCostDrag).toBeCloseTo(
      costed.avgTurnover * (10 / 10_000) * costed.oosMonths.length,
      12,
    );
    expect(costed.strategy.totalReturn).toBeLessThan(result.strategy.totalReturn);
  });

  it("fails closed when the unshipped real-data fixtures are absent", () => {
    expect(() => loadRealPrices()).toThrow(/Missing real price fixture/);
    expect(() => loadRealEvents()).toThrow(/Missing real event fixture/);
    expect(() => runGenuineBacktest({ costBps: 10, oosStart: "2025-01" })).toThrow(
      /Missing real price fixture/,
    );
  });
});
