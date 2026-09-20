import { allMonthSentiments } from "./aggregate";
import { ASSET_IDS, ASSETS, SAMPLE_MONTHS } from "./assets";
import type { MonthlyMetrics } from "./types";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rng: () => number) {
  const u = Math.max(rng(), 1e-9);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const ANNUAL_DRIFT: Record<string, number> = {
  GSPC: 0.11,
  IXIC: 0.15,
  DJI: 0.09,
  FCHI: 0.08,
  FTSE: 0.07,
  SX5E: 0.085,
  HSI: 0.04,
  SSEC: 0.03,
  BSESN: 0.13,
  NSEI: 0.125,
  KS11: 0.08,
  GC: 0.16,
  SI: 0.14,
  CL: 0.02,
};

const ANNUAL_VOL: Record<string, number> = {
  GSPC: 0.15,
  IXIC: 0.2,
  DJI: 0.13,
  FCHI: 0.16,
  FTSE: 0.13,
  SX5E: 0.16,
  HSI: 0.22,
  SSEC: 0.18,
  BSESN: 0.14,
  NSEI: 0.14,
  KS11: 0.19,
  GC: 0.15,
  SI: 0.24,
  CL: 0.32,
};

const BETA: Record<string, number> = {
  GSPC: 1,
  IXIC: 1.15,
  DJI: 0.85,
  FCHI: 0.9,
  FTSE: 0.7,
  SX5E: 0.95,
  HSI: 0.55,
  SSEC: 0.4,
  BSESN: 0.5,
  NSEI: 0.5,
  KS11: 0.85,
  GC: -0.15,
  SI: 0.1,
  CL: 0.35,
};

/** Hand-placed tape events so the sample path has recognizable 2024–25 episodes. */
const MONTH_FACTOR: Record<string, number> = {
  "2024-01": 0.012,
  "2024-02": 0.04,
  "2024-03": 0.025,
  "2024-04": -0.042,
  "2024-05": 0.038,
  "2024-06": -0.01,
  "2024-07": 0.012,
  "2024-08": -0.065,
  "2024-09": 0.028,
  "2024-10": -0.012,
  "2024-11": 0.048,
  "2024-12": -0.018,
  "2025-01": -0.03,
  "2025-02": 0.016,
  "2025-03": 0.022,
  "2025-04": -0.09,
  "2025-05": 0.055,
  "2025-06": 0.018,
  "2025-07": 0.02,
  "2025-08": 0.01,
  "2025-09": 0.024,
  "2025-10": 0.014,
  "2025-11": 0.008,
  "2025-12": 0.012,
};

const ASSET_SHOCKS: Record<string, Record<string, number>> = {
  "2024-01": { HSI: -0.06, SSEC: -0.04, GC: 0.03 },
  "2024-02": { IXIC: 0.05, KS11: 0.04, SSEC: -0.03 },
  "2024-03": { GC: 0.06, CL: 0.04 },
  "2024-04": { GSPC: -0.04, DJI: -0.03, CL: 0.05 },
  "2024-05": { NSEI: 0.045, BSESN: 0.04 },
  "2024-06": { FCHI: -0.07, SX5E: -0.035, SI: -0.03 },
  "2024-07": { FCHI: 0.035, CL: -0.05 },
  "2024-08": { GSPC: -0.03, KS11: -0.08, IXIC: -0.04, GC: 0.04 },
  "2024-09": { HSI: 0.14, SSEC: 0.12, GSPC: 0.02 },
  "2024-10": { HSI: -0.05, CL: -0.03, DJI: 0.025 },
  "2024-11": { GSPC: 0.04, SSEC: -0.05, IXIC: 0.01 },
  "2024-12": { GC: 0.03, FTSE: 0.015 },
  "2025-01": { IXIC: -0.07, KS11: -0.06, SSEC: 0.05 },
  "2025-02": { GC: 0.05, SI: 0.07 },
  "2025-03": { SX5E: 0.06, FCHI: 0.04, FTSE: 0.03 },
  "2025-04": { GSPC: -0.08, HSI: -0.09, CL: -0.07, GC: 0.02 },
  "2025-05": { GSPC: 0.06, IXIC: 0.07, NSEI: 0.03 },
  "2025-06": { CL: 0.08, GC: 0.04, SX5E: 0.02 },
  "2025-07": { IXIC: 0.04, KS11: 0.035, DJI: 0.02 },
  "2025-08": { GSPC: 0.025, FTSE: -0.03 },
  "2025-09": { GSPC: 0.02, HSI: -0.04, BSESN: 0.025 },
  "2025-10": { GC: 0.06, SI: 0.08, SSEC: -0.02 },
  "2025-11": { GSPC: 0.02, CL: -0.08, SX5E: 0.015 },
  "2025-12": { GC: 0.03, NSEI: 0.02, DJI: 0.015 },
};

export type DailyBar = {
  date: string;
  close: Record<string, number>;
};

export type MarketBundle = {
  months: readonly string[];
  startPrices: Record<string, number>;
  monthEndPrices: Record<string, Record<string, number>>;
  metrics: MonthlyMetrics[];
};

const START_PRICES: Record<string, number> = {
  GSPC: 4770,
  IXIC: 15000,
  DJI: 37700,
  FCHI: 7550,
  FTSE: 7730,
  SX5E: 4520,
  HSI: 17000,
  SSEC: 2970,
  BSESN: 72200,
  NSEI: 21700,
  KS11: 2660,
  GC: 2060,
  SI: 24.2,
  CL: 72.4,
};

function daysInMonth(month: string): string[] {
  const [y, m] = month.split("-").map(Number);
  const dim = new Date(y, m, 0).getDate();
  const dates: string[] = [];
  for (let d = 1; d <= dim; d += 1) {
    const dt = new Date(Date.UTC(y, m - 1, d));
    const wd = dt.getUTCDay();
    if (wd === 0 || wd === 6) continue;
    dates.push(dt.toISOString().slice(0, 10));
  }
  return dates;
}

function statsFromReturns(rs: number[]) {
  if (rs.length === 0) {
    return { mean: 0, vol: 0, sharpe: 0, sortino: 0, mdd: 0, compounded: 0 };
  }
  const mean = rs.reduce((a, b) => a + b, 0) / rs.length;
  const varSum = rs.reduce((a, b) => a + (b - mean) ** 2, 0) / rs.length;
  const volD = Math.sqrt(varSum);
  const down = rs.filter((r) => r < 0);
  const dvar =
    down.length === 0
      ? 0
      : down.reduce((a, b) => a + b * b, 0) / down.length;
  const sortinoD = Math.sqrt(dvar);
  let peak = 1;
  let nav = 1;
  let mdd = 0;
  for (const r of rs) {
    nav *= 1 + r;
    peak = Math.max(peak, nav);
    mdd = Math.min(mdd, nav / peak - 1);
  }
  const vol = volD * Math.sqrt(252);
  const sharpe = volD > 0 ? (mean / volD) * Math.sqrt(252) : 0;
  const sortino = sortinoD > 0 ? (mean / sortinoD) * Math.sqrt(252) : sharpe;
  return { mean, vol, sharpe, sortino, mdd, compounded: nav - 1 };
}

let cached: MarketBundle | null = null;

export function getMarket(): MarketBundle {
  if (cached) return cached;
  const rng = mulberry32(25071856);
  // Returns are a frozen seeded tape — independent of the scorer so that
  // changing sentiment actually changes weights, not the underlying path.
  const sentiments = allMonthSentiments();
  const prices = { ...START_PRICES };
  const monthEndPrices: Record<string, Record<string, number>> = {};
  const metrics: MonthlyMetrics[] = [];

  for (const month of SAMPLE_MONTHS) {
    const dates = daysInMonth(month);
    const factor = MONTH_FACTOR[month] ?? 0;
    const sent = sentiments[month]?.sentiment ?? {};
    const daily: Record<string, number[]> = Object.fromEntries(
      ASSET_IDS.map((id) => [id, [] as number[]])
    );

    for (let i = 0; i < dates.length; i += 1) {
      const mkt = factor / dates.length + 0.009 * gauss(rng);
      for (const asset of ASSETS) {
        const id = asset.id;
        const drift = ANNUAL_DRIFT[id] / 252;
        const vol = ANNUAL_VOL[id] / Math.sqrt(252);
        const shock = (ASSET_SHOCKS[month]?.[id] ?? 0) / dates.length;
        const r =
          drift + BETA[id] * mkt + vol * gauss(rng) * 0.92 + shock;
        prices[id] *= 1 + r;
        daily[id].push(r);
      }
    }

    monthEndPrices[month] = { ...prices };
    const returns: Record<string, number> = {};
    const vol: Record<string, number> = {};
    const sharpe: Record<string, number> = {};
    const sortino: Record<string, number> = {};
    const calmar: Record<string, number> = {};
    const maxDrawdown: Record<string, number> = {};
    for (const id of ASSET_IDS) {
      const s = statsFromReturns(daily[id]);
      returns[id] = s.compounded;
      vol[id] = s.vol;
      sharpe[id] = s.sharpe;
      sortino[id] = s.sortino;
      maxDrawdown[id] = s.mdd;
      const annualised = (1 + s.compounded) ** 12 - 1;
      calmar[id] = s.mdd < 0 ? annualised / Math.abs(s.mdd) : 0;
    }
    metrics.push({
      month,
      returns,
      vol,
      sharpe,
      sortino,
      calmar,
      maxDrawdown,
      sentiment: { ...sent },
      articleCount: { ...(sentiments[month]?.articleCount ?? {}) },
    });
  }

  cached = {
    months: SAMPLE_MONTHS,
    startPrices: START_PRICES,
    monthEndPrices,
    metrics,
  };
  return cached;
}

export function metricsByMonth(): Record<string, MonthlyMetrics> {
  return Object.fromEntries(getMarket().metrics.map((m) => [m.month, m]));
}
