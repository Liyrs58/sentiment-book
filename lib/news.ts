import type { RawArticle } from "./types";

const SYNTH_SOURCES = [
  "Demo Financial Wire",
  "Synthetic Research Feed",
  "Simulated Market News",
] as const;

function synthSource(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return SYNTH_SOURCES[h % SYNTH_SOURCES.length];
}

function article(
  id: string,
  date: string,
  ticker: string,
  _legacySource: string,
  headline: string,
  dek: string
): RawArticle {
  return {
    id,
    date,
    month: date.slice(0, 7),
    ticker,
    source: synthSource(id),
    headline,
    dek,
    desk: true,
    sourceType: "synthetic",
    dataAsOf: date,
    generated: true,
  };
}

/**
 * Editorial desk wire for the 2024–2025 sample window (SYNTHETIC).
 * Headlines are demo copy — not FT/Reuters/WSJ/Bloomberg content.
 * Scores are produced by the scorer, not stored here.
 */
export const EDITORIAL_CORPUS: RawArticle[] = [];
