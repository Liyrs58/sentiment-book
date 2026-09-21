/**
 * Walk-forward backtest over supplied monthly price and timestamped event
 * inputs. Output preserves their declared provenance; input quality and
 * reproducibility must be verified before describing results as evidence.
 * Includes costs, turnover, benchmark, and an OOS split.
 */

import { ASSET_IDS } from "./assets";
import {
  allocateFromSentiment,
  loadRealEvents,
  loadRealPrices,
  monthlyReturnsFromPrices,
  sentimentFromEvents,
} from "./real-data";
import type { RealEventArticle, RealPriceBundle } from "./real-data";
import type { BacktestStats, SourceType, WeightMap } from "./types";
import { CONSTRAINTS } from "./constraints";

export type GenuineBacktestOptions = {
  /** One-way proportional cost (e.g. 0.001 = 10 bps). */
  costBps?: number;
  /** First OOS month (YYYY-MM). Earlier months = IS warm-up. */
  oosStart?: string;
};

export type GenuineBacktestResult = {
  provenance: {
    prices: { sourceType: SourceType; source: string; fetchedAt: string };
    events: Record<SourceType, number>;
  };
  methodology: string;
  limitations: string[];
  costBps: number;
  oosStart: string;
  months: string[];
  oosMonths: string[];
  avgTurnover: number;
  totalCostDrag: number;
  strategy: BacktestStats;
  equal: BacktestStats;
  benchmarkSpx: BacktestStats;
  curve: { month: string; strategy: number; equal: number; spx: number }[];
  eventCount: number;
  priceSource: string;
};

function stats(navs: number[], months: number): BacktestStats {
  const rets: number[] = [];
  for (let i = 1; i < navs.length; i += 1) rets.push(navs[i] / navs[i - 1] - 1);
  const mean = rets.reduce((a, b) => a + b, 0) / Math.max(rets.length, 1);
  const varr =
    rets.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(rets.length, 1);
  const volM = Math.sqrt(varr);
  const vol = volM * Math.sqrt(12);
  const cagr = navs[navs.length - 1] ** (12 / Math.max(months, 1)) - 1;
  const sharpe = volM > 0 ? (mean / volM) * Math.sqrt(12) : 0;
  let peak = navs[0];
  let mdd = 0;
  for (const n of navs) {
    peak = Math.max(peak, n);
    mdd = Math.min(mdd, n / peak - 1);
  }
  return {
    cagr,
    sharpe,
    maxDrawdown: mdd,
    calmar: mdd < 0 ? cagr / Math.abs(mdd) : 0,
    volatility: vol,
    totalReturn: navs[navs.length - 1] / navs[0] - 1,
  };
}

function turnover(a: WeightMap, b: WeightMap): number {
  let t = 0;
  for (const id of ASSET_IDS) t += Math.abs((a[id] ?? 0) - (b[id] ?? 0));
  return t / 2;
}

function equalWeights(): WeightMap {
  const w = 1 / ASSET_IDS.length;
  return Object.fromEntries(ASSET_IDS.map((id) => [id, w]));
}

export function runGenuineBacktest(
  options: GenuineBacktestOptions = {}
): GenuineBacktestResult {
  return runGenuineBacktestFromData(loadRealPrices(), loadRealEvents(), options);
}

export function runGenuineBacktestFromData(
  prices: RealPriceBundle,
  sourceEvents: RealEventArticle[],
  options: GenuineBacktestOptions = {}
): GenuineBacktestResult {
  const costBps = options.costBps ?? 10;
  const cost = costBps / 10_000;
  const oosStart = options.oosStart ?? "2025-01";
  if (!Number.isFinite(costBps) || costBps < 0) {
    throw new Error("costBps must be a finite non-negative number");
  }
  const events = sourceEvents;
  const eventCounts: Record<SourceType, number> = {
    synthetic: 0,
    external: 0,
    "manually-curated": 0,
  };
  for (const event of events) eventCounts[event.sourceType] += 1;
  const { months, returns } = monthlyReturnsFromPrices(prices);
  let stratNav = 1;
  let eqNav = 1;
  let spxNav = 1;
  const curve: GenuineBacktestResult["curve"] = [
    { month: "start", strategy: 1, equal: 1, spx: 1 },
  ];
  let prev: WeightMap = equalWeights();
  const turnoverByMonth: { month: string; turnover: number; costDrag: number }[] = [];
  const usedMonths: string[] = [];

  for (const retMonth of months) {
    const [y, m] = retMonth.split("-").map(Number);
    const allocMonth =
      m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;

    const equal = equalWeights();
    const sentiment = sentimentFromEvents(events, allocMonth);
    const allocation = allocateFromSentiment(sentiment);

    const retMap = returns[retMonth];
    if (!retMap) continue;

    let h = 0;
    let e = 0;
    for (const id of ASSET_IDS) {
      h += (allocation[id] ?? 0) * (retMap[id] ?? 0);
      e += (equal[id] ?? 0) * (retMap[id] ?? 0);
    }

    const tov = turnover(prev, allocation);
    // turnover() is one-way traded notional (half-L1); charge the configured
    // one-way basis-point cost once against that traded notional.
    const costDrag = tov * cost;
    turnoverByMonth.push({ month: retMonth, turnover: tov, costDrag });
    h -= costDrag;

    stratNav *= 1 + h;
    eqNav *= 1 + e;
    spxNav *= 1 + (retMap.GSPC ?? 0);
    curve.push({
      month: retMonth,
      strategy: stratNav,
      equal: eqNav,
      spx: spxNav,
    });
    usedMonths.push(retMonth);
    prev = allocation;
  }

  const oosMonths = usedMonths.filter((m) => m >= oosStart);
  if (oosMonths.length === 0) {
    throw new Error(`No untouched test months at or after ${oosStart}`);
  }
  const firstOosCurveIndex = curve.findIndex((point) => point.month === oosMonths[0]);
  const oosCurve = curve.slice(Math.max(0, firstOosCurveIndex - 1));
  const oosTurnovers = turnoverByMonth.filter((row) => row.month >= oosStart);
  const avgTurnover =
    oosTurnovers.reduce((a, b) => a + b.turnover, 0) / oosTurnovers.length;
  const totalCostDrag = oosTurnovers.reduce((a, b) => a + b.costDrag, 0);

  return {
    provenance: {
      prices: {
        sourceType: prices.sourceType,
        source: prices.source,
        fetchedAt: prices.fetchedAt,
      },
      events: eventCounts,
    },
    methodology:
      `${prices.sourceType} monthly closes from ${prices.source} + timestamped event inputs ` +
      `(synthetic ${eventCounts.synthetic}, external ${eventCounts.external}, manually curated ${eventCounts["manually-curated"]}); ` +
      `lexicon baseline S=P_pos-P_neg; weights from month t → returns t+${CONSTRAINTS.decisionLagMonths}; ` +
      `long-only project() floor/cap; one-way cost ${costBps} bps on turnover; benchmark = GSPC; OOS from ${oosStart}.`,
    limitations: [
      "Small event sample; sparse coverage outside curated + GDELT titles.",
      "Lexicon baseline — not ProsusAI FinBERT unless a dump is loaded separately.",
      "Monthly resolution only; no intraday cutoff refinement.",
      "SEC Atom sample may fall outside the 2024–25 window depending on fetch date.",
      "Index/futures Yahoo symbols are research proxies — not tradeable ETF fills.",
      "Do not compare these stats to the HARLF paper's reported CAGR/Sharpe.",
    ],
    costBps,
    oosStart,
    months: usedMonths,
    oosMonths,
    avgTurnover,
    totalCostDrag,
    strategy: stats(
      oosCurve.map((c) => c.strategy),
      oosMonths.length
    ),
    equal: stats(
      oosCurve.map((c) => c.equal),
      oosMonths.length
    ),
    benchmarkSpx: stats(
      oosCurve.map((c) => c.spx),
      oosMonths.length
    ),
    curve,
    eventCount: events.length,
    priceSource: prices.source,
  };
}
