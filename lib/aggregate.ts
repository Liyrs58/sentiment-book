import { NEWS } from "./news";
import { signedScore } from "./sentiment";
import type { FinbertScores } from "./types";

export function monthSentiment(
  month: string,
  extra?: { ticker: string; scores: FinbertScores; weight?: number }
): { sentiment: Record<string, number>; articleCount: Record<string, number> } {
  const buckets: Record<string, number[]> = {};
  for (const article of NEWS) {
    if (article.month !== month) continue;
    (buckets[article.ticker] ??= []).push(signedScore(article.scores));
  }
  if (extra) {
    const w = extra.weight ?? 2.4;
    const s = signedScore(extra.scores);
    const current = buckets[extra.ticker] ?? [];
    for (let i = 0; i < Math.round(w); i += 1) current.push(s);
    buckets[extra.ticker] = current;
  }
  const sentiment: Record<string, number> = {};
  const articleCount: Record<string, number> = {};
  for (const [ticker, values] of Object.entries(buckets)) {
    articleCount[ticker] = values.length;
    sentiment[ticker] = values.reduce((a, b) => a + b, 0) / values.length;
  }
  return { sentiment, articleCount };
}

export function allMonthSentiments(): Record<
  string,
  { sentiment: Record<string, number>; articleCount: Record<string, number> }
> {
  const months = Array.from(new Set(NEWS.map((n) => n.month)));
  return Object.fromEntries(months.map((m) => [m, monthSentiment(m)]));
}
