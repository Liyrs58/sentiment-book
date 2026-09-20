/**
 * Genuine-data research path: historical Yahoo monthly closes + legal
 * timestamped events (GDELT / RSS / SEC / manually curated chronology).
 * Offline fixtures under data/real/. Never labels content as FT/Reuters/WSJ/Bloomberg.
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { ASSET_IDS } from "./assets";
import { lexiconScore, signedScore } from "./sentiment";
import {
  articlesForAllocationMonth,
  assertNoFutureArticles,
  marketCutoffForMonth,
  returnMonthForAllocation,
} from "./temporal";
import type { RawArticle, SourceType, WeightMap } from "./types";
import { CONSTRAINTS, project } from "./constraints";

export type RealPriceBar = { month: string; timestamp: number; close: number };

export type RealPriceBundle = {
  tapeKind: "REAL_HISTORICAL_DATA";
  source: string;
  fetchedAt: string;
  series: Record<string, { yahooSymbol: string; bars: RealPriceBar[] }>;
};

export type RealEventArticle = RawArticle & {
  url?: string;
  provider?: string;
};

function dataPath(...parts: string[]): string {
  return join(process.cwd(), "data", "real", ...parts);
}

export function loadRealPrices(): RealPriceBundle {
  const path = dataPath("yahoo-monthly-2024-2025.json");
  if (!existsSync(path)) {
    throw new Error(`Missing real price fixture: ${path}`);
  }
  const raw = JSON.parse(readFileSync(path, "utf8")) as {
    source: string;
    fetchedAt: string;
    series: RealPriceBundle["series"];
  };
  return {
    tapeKind: "REAL_HISTORICAL_DATA",
    source: raw.source,
    fetchedAt: raw.fetchedAt,
    series: raw.series,
  };
}

export function loadRealEvents(): RealEventArticle[] {
  const path = dataPath("events-gdelt-sec.json");
  if (!existsSync(path)) {
    throw new Error(`Missing real event fixture: ${path}`);
  }
  const raw = JSON.parse(readFileSync(path, "utf8")) as {
    articles: Array<Record<string, unknown>>;
  };
  return raw.articles.map((a) => {
    const date = String(a.date);
    return {
      id: String(a.id),
      date,
      month: String(a.month ?? date.slice(0, 7)),
      ticker: String(a.ticker),
      source: String(a.source),
      headline: String(a.headline),
      dek: String(a.dek ?? ""),
      desk: false,
      sourceType: (a.sourceType as SourceType) ?? "external",
      dataAsOf: String(a.dataAsOf ?? date),
      generated: Boolean(a.generated),
      url: a.url ? String(a.url) : undefined,
      provider: a.provider ? String(a.provider) : undefined,
    };
  });
}

/** Monthly simple returns from adjacent month-end closes. */
export function monthlyReturnsFromPrices(
  bundle: RealPriceBundle
): { months: string[]; returns: Record<string, Record<string, number>> } {
  const monthSet = new Set<string>();
  for (const id of ASSET_IDS) {
    for (const bar of bundle.series[id]?.bars ?? []) monthSet.add(bar.month);
  }
  const months = Array.from(monthSet).sort();
  const returns: Record<string, Record<string, number>> = {};
  for (let i = 1; i < months.length; i += 1) {
    const prev = months[i - 1];
    const cur = months[i];
    returns[cur] = {};
    for (const id of ASSET_IDS) {
      const bars = bundle.series[id]?.bars ?? [];
      const a = bars.find((b) => b.month === prev);
      const b = bars.find((b) => b.month === cur);
      if (!a || !b || a.close <= 0) {
        returns[cur][id] = 0;
      } else {
        returns[cur][id] = b.close / a.close - 1;
      }
    }
  }
  return { months: months.slice(1), returns };
}

export function sentimentFromEvents(
  events: RealEventArticle[],
  allocationMonth: string
): Record<string, number> {
  const cutoff = marketCutoffForMonth(allocationMonth);
  const eligible = articlesForAllocationMonth(events, allocationMonth, cutoff).filter(
    (ev) => ev.month === allocationMonth
  );
  assertNoFutureArticles(eligible, cutoff);
  const buckets: Record<string, number[]> = {};
  for (const ev of eligible) {
    const scores = lexiconScore(`${ev.headline}. ${ev.dek}`);
    (buckets[ev.ticker] ??= []).push(signedScore(scores));
  }
  const out: Record<string, number> = {};
  for (const id of ASSET_IDS) {
    const xs = buckets[id];
    out[id] = xs?.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
  }
  return out;
}

/** Softmax tilt from sentiment → constrained weights (same project() as desk). */
export function allocateFromSentiment(sentiment: Record<string, number>): WeightMap {
  const raw: WeightMap = {};
  const temp = 0.55;
  const vals = ASSET_IDS.map((id) => sentiment[id] ?? 0);
  const max = Math.max(...vals, 0);
  const exps = vals.map((v) => Math.exp((v - max) / temp));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  ASSET_IDS.forEach((id, i) => {
    raw[id] = 0.55 * (1 / ASSET_IDS.length) + 0.45 * (exps[i] / sum);
  });
  return project(raw);
}

export { marketCutoffForMonth, returnMonthForAllocation, CONSTRAINTS };
