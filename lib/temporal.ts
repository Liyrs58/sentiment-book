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

/** Default market cutoff for a decision month: month-end close. */
export function marketCutoffForMonth(month: string): string {
  return monthEndDate(month);
}

/**
 * First month the article is tradable into an allocation:
 * article must be observed by cutoff; allocation month is that month;
 * returns accrue the following month (decision lag).
 */
export function tradableAllocationMonth(
  articleDate: string,
  cutoffForMonth: (month: string) => string = marketCutoffForMonth
): string {
  const month = articleDate.slice(0, 7);
  const cutoff = cutoffForMonth(month);
  // If article arrives after month-end cutoff, it belongs to the next month.
  if (articleDate > cutoff) {
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

export type TimedArticle = { id: string; date: string; month: string };

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
    if (a.date > cutoff) return false;
    const tradable = tradableAllocationMonth(a.date);
    return tradable <= allocationMonth && a.date.slice(0, 7) <= allocationMonth;
  });
}

/** Assert no article dated after `asOf` appears in the eligible set. */
export function assertNoFutureArticles<T extends TimedArticle>(
  eligible: T[],
  asOf: string
): void {
  for (const a of eligible) {
    if (a.date > asOf) {
      throw new Error(
        `Future leak: article ${a.id} dated ${a.date} after as-of ${asOf}`
      );
    }
  }
}
