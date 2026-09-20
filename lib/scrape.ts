import { getDeskWire, getRawCorpus } from "./corpus";
import type { RawArticle } from "./types";

/**
 * Optional live scrape hook.
 *
 * HARLF (paper §3.2) pulls the top 10 Google News hits per asset-month.
 * This repo does not scrape by default: QA and the desk run on the shipped
 * sample corpus. Set LIVE_SCRAPE=1 only if you provide a lawful adapter.
 */
export async function loadMonthPrints(month: string): Promise<{
  source: "sample-corpus" | "live-scrape";
  articles: RawArticle[];
}> {
  if (process.env.LIVE_SCRAPE === "1") {
    throw new Error(
      "LIVE_SCRAPE=1 is set but no scraper adapter is configured. Ship one under lib/scrape.ts or unset the flag to use the sample corpus."
    );
  }
  return {
    source: "sample-corpus",
    articles: getRawCorpus().filter((a) => a.month === month),
  };
}

export function deskPrints(month: string) {
  return getDeskWire().filter((a) => a.month <= month);
}
