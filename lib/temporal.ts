/**
 * Temporal alignment helpers for news → allocation → returns.
 *
 * Rules (research path):
 * - Article timestamps must be known (ISO date).
 * - Market cutoff: only articles with date <= month-end (or explicit cutoff)
 *   may enter month-t sentiment.
 * - Tradable time: weights formed at month-t close are applied to month t+1
 *   returns (one-period lag) — matches CONSTRAINTS.decisionLagMonths.
 * - No future articles in earlier allocations.
 */

import { CONSTRAINTS } from "./constraints";

/** Last calendar day of YYYY-MM as ISO date. */
export function monthEndDate(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${month}-${String(dim).padStart(2, "0")}`;
}

/**
 * Month-end rebalance cutoff at 16:00 America/New_York on the last calendar
 * day. This is a timestamped US-market proxy; this project does not ship per-
 * exchange holiday calendars.
 */
export function marketCutoffForMonth(month: string): string {
  const date = monthEndDate(month);
  const noonUtc = new Date(`${date}T12:00:00.000Z`);
  const zone = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "shortOffset",
  })
    .formatToParts(noonUtc)
    .find((part) => part.type === "timeZoneName")?.value;
  const offset = zone?.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
  if (!offset) throw new Error(`Could not resolve New York offset for ${date}`);
  const minutes = (Number(offset[2]) * 60 + Number(offset[3] ?? 0)) *
    (offset[1] === "-" ? -1 : 1);
  const utcMs = Date.parse(`${date}T16:00:00.000Z`) - minutes * 60_000;
  return new Date(utcMs).toISOString();
}

/**
 * First month the article is tradable into an allocation:
 * article must be observed by cutoff; allocation month is that month;
 * returns accrue the following month (decision lag).
 */
export function tradableAllocationMonth(
  articleTimestamp: string | undefined,
  cutoffForMonth: (month: string) => string = marketCutoffForMonth
): string | null {
  if (!isTimestamp(articleTimestamp)) return null;
  const month = articleTimestamp.slice(0, 7);
  const cutoff = cutoffForMonth(month);
  // If the article arrives after the close, it belongs to the next month.
  if (Date.parse(articleTimestamp) > Date.parse(cutoff)) {
    const [y, m] = month.split("-").map(Number);
    const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
    return next;
  }
  return month;
}

export function returnMonthForAllocation(allocationMonth: string): string {
  const lag = CONSTRAINTS.decisionLagMonths;
  const [y, m] = allocationMonth.split("-").map(Number);
  let yy = y;
  let mm = m + lag;
  while (mm > 12) {
    mm -= 12;
    yy += 1;
  }
  return `${yy}-${String(mm).padStart(2, "0")}`;
}

export type TimedArticle = { id: string; timestamp?: string };

function isTimestamp(value: string | undefined): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}

/**
 * Articles eligible for month-t sentiment: observed on or before the cutoff,
 * and not from a future calendar month relative to t.
 */
export function articlesForAllocationMonth<T extends TimedArticle>(
  articles: T[],
  allocationMonth: string,
  cutoff: string = marketCutoffForMonth(allocationMonth)
): T[] {
  return articles.filter((a) => {
    if (!isTimestamp(a.timestamp)) return false;
    if (Date.parse(a.timestamp) > Date.parse(cutoff)) return false;
    const tradable = tradableAllocationMonth(a.timestamp);
    return tradable === allocationMonth;
  });
}

/** Assert no article dated after `asOf` appears in the eligible set. */
export function assertNoFutureArticles<T extends TimedArticle>(
  eligible: T[],
  asOf: string
): void {
  const asOfMs = Date.parse(asOf);
  if (!Number.isFinite(asOfMs)) throw new Error(`Invalid as-of timestamp: ${asOf}`);
  for (const a of eligible) {
    if (!isTimestamp(a.timestamp)) {
      throw new Error(`Missing or invalid timestamp for article ${a.id}`);
    }
    if (Date.parse(a.timestamp) > asOfMs) {
      throw new Error(
        `Future leak: article ${a.id} dated ${a.timestamp} after as-of ${asOf}`
      );
    }
  }
}
