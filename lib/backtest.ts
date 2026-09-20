import { SAMPLE_MONTHS } from "./assets";
import { allocate } from "./allocator";
import { getMarket } from "./market";
import type { BacktestResult, BacktestStats, EquityPoint, WeightMap } from "./types";

function stats(navs: number[], months: number): BacktestStats {
  const rets: number[] = [];
  for (let i = 1; i < navs.length; i += 1) {
    rets.push(navs[i] / navs[i - 1] - 1);
  }
  const mean = rets.reduce((a, b) => a + b, 0) / Math.max(rets.length, 1);
  const varr =
    rets.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(rets.length, 1);
  const volM = Math.sqrt(varr);
  const vol = volM * Math.sqrt(12);
  const cagr = navs[navs.length - 1] ** (12 / months) - 1;
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

export function runBacktest(throughMonth?: string): BacktestResult {
  const market = getMarket();
  const last = throughMonth ?? SAMPLE_MONTHS[SAMPLE_MONTHS.length - 1];
  const months = SAMPLE_MONTHS.filter((m) => m <= last);
  let harlfNav = 1;
  let equalNav = 1;
  let spxNav = 1;
  const curve: EquityPoint[] = [
    { month: "start", harlf: 1, equal: 1, spx: 1 },
  ];

  let prevWeights: WeightMap | null = null;
  for (const month of months) {
    const metrics = market.metrics.find((m) => m.month === month);
    if (!metrics) continue;
    const allocation = prevWeights ?? allocate({ month }).superWeights;
    const equal = allocate({ month }).equalWeights;
    let h = 0;
    let e = 0;
    for (const id of Object.keys(allocation)) {
      h += allocation[id] * (metrics.returns[id] ?? 0);
      e += equal[id] * (metrics.returns[id] ?? 0);
    }
    harlfNav *= 1 + h;
    equalNav *= 1 + e;
    spxNav *= 1 + (metrics.returns.GSPC ?? 0);
    curve.push({
      month,
      harlf: harlfNav,
      equal: equalNav,
      spx: spxNav,
    });
    prevWeights = allocate({ month }).superWeights;
  }

  const n = months.length;
  return {
    curve,
    harlf: stats(
      curve.map((c) => c.harlf),
      n
    ),
    equal: stats(
      curve.map((c) => c.equal),
      n
    ),
    spx: stats(
      curve.map((c) => c.spx),
      n
    ),
  };
}
