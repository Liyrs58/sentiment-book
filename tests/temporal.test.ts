import { describe, expect, it } from "vitest";
import {
  articlesForAllocationMonth,
  assertNoFutureArticles,
  marketCutoffForMonth,
  monthEndDate,
  returnMonthForAllocation,
  tradableAllocationMonth,
} from "@/lib/temporal";
import { CONSTRAINTS } from "@/lib/constraints";

describe("temporal alignment", () => {
  it("month-end cutoff is last calendar day", () => {
    expect(monthEndDate("2024-02")).toBe("2024-02-29");
    expect(marketCutoffForMonth("2024-04")).toBe("2024-04-30T20:00:00.000Z");
  });

  it("one-period lag maps allocation month to next return month", () => {
    expect(CONSTRAINTS.decisionLagMonths).toBe(1);
    expect(returnMonthForAllocation("2024-05")).toBe("2024-06");
    expect(returnMonthForAllocation("2024-12")).toBe("2025-01");
  });

  it("article after the rebalance close rolls to the next allocation month", () => {
    expect(tradableAllocationMonth("2024-04-30T20:00:00.001Z")).toBe("2024-05");
    expect(tradableAllocationMonth("2024-04-30T20:00:00.000Z")).toBe("2024-04");
  });

  it("excludes future articles from earlier allocations", () => {
    const articles = [
      { id: "a", timestamp: "2024-03-10T12:00:00.000Z" },
      { id: "b", timestamp: "2024-05-01T12:00:00.000Z" },
      { id: "c", timestamp: "2024-04-30T19:00:00.000Z" },
    ];
    const eligible = articlesForAllocationMonth(articles, "2024-04");
    expect(eligible.map((x) => x.id).sort()).toEqual(["c"]);
    assertNoFutureArticles(eligible, marketCutoffForMonth("2024-04"));
    expect(() =>
      assertNoFutureArticles(articles, marketCutoffForMonth("2024-04"))
    ).toThrow(/Future leak/);
  });

  it("no future article dated after cutoff enters April book", () => {
    const articles = [
      { id: "early", timestamp: "2024-04-02T12:00:00.000Z" },
      { id: "future", timestamp: "2024-05-02T12:00:00.000Z" },
    ];
    const eligible = articlesForAllocationMonth(articles, "2024-04");
    expect(eligible.some((a) => a.id === "future")).toBe(false);
    for (const a of eligible) {
      expect(a.timestamp! <= marketCutoffForMonth("2024-04")).toBe(true);
    }
  });

  it("includes an event just after close only in the next allocation month", () => {
    const articles = [
      { id: "pre-close", timestamp: "2024-04-30T19:59:59.999Z" },
      { id: "at-cutoff", timestamp: "2024-04-30T20:00:00.000Z" },
      { id: "after-close", timestamp: "2024-04-30T20:00:00.001Z" },
      { id: "future-month", timestamp: "2024-05-01T12:00:00.000Z" },
      { id: "missing-time", timestamp: undefined },
    ];
    expect(articlesForAllocationMonth(articles, "2024-04").map((a) => a.id)).toEqual([
      "pre-close",
      "at-cutoff",
    ]);
    expect(articlesForAllocationMonth(articles, "2024-05").map((a) => a.id)).toContain(
      "after-close",
    );
    expect(articlesForAllocationMonth(articles, "2024-04").map((a) => a.id)).not.toContain(
      "future-month",
    );
    expect(articlesForAllocationMonth(articles, "2024-05").map((a) => a.id)).not.toContain(
      "missing-time",
    );
  });
});
