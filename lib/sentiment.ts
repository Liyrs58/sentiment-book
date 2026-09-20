import type { FinbertScores } from "./types";

const POSITIVE = [
  "rally",
  "surges",
  "surge",
  "record",
  "records",
  "beat",
  "beats",
  "beats estimates",
  "cool",
  "cools",
  "cut",
  "cuts",
  "dovish",
  "bid",
  "lift",
  "lifts",
  "firm",
  "firms",
  "gain",
  "gains",
  "high",
  "outperform",
  "stimulus",
  "package",
  "insurance",
  "stabilize",
  "improves",
  "improve",
  "strong",
  "clears",
  "rebuilds",
  "relief",
];

const NEGATIVE = [
  "tumble",
  "tumbles",
  "slump",
  "slide",
  "slides",
  "slip",
  "slips",
  "miss",
  "misses",
  "sticky",
  "wobble",
  "wobbles",
  "fear",
  "scare",
  "panic",
  "crash",
  "worst",
  "gap lower",
  "hammers",
  "knock",
  "knocks",
  "tariff",
  "selloff",
  "sold",
  "disappoint",
  "disappoints",
  "surplus",
  "glut",
  "recession",
  "downgrade",
  "thin",
];

function countHits(text: string, lexicon: string[]): number {
  const t = text.toLowerCase();
  return lexicon.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0);
}

/** Offline stand-in when Hugging Face FinBERT is not configured. */
export function lexiconScore(text: string): FinbertScores {
  const pos = countHits(text, POSITIVE);
  const neg = countHits(text, NEGATIVE);
  const raw = pos + neg;
  if (raw === 0) {
    return { positive: 0.18, negative: 0.16, neutral: 0.66 };
  }
  const positive = 0.12 + (0.7 * pos) / (raw + 0.4);
  const negative = 0.12 + (0.7 * neg) / (raw + 0.4);
  const sum = positive + negative;
  const cappedPos = Number((positive / (sum + 0.18)).toFixed(4));
  const cappedNeg = Number((negative / (sum + 0.18)).toFixed(4));
  return {
    positive: cappedPos,
    negative: cappedNeg,
    neutral: Number((1 - cappedPos - cappedNeg).toFixed(4)),
  };
}

export function signedScore(scores: FinbertScores): number {
  return scores.positive - scores.negative;
}

export function labelForScore(signed: number): "pos" | "neg" | "neu" {
  if (signed >= 0.18) return "pos";
  if (signed <= -0.18) return "neg";
  return "neu";
}
