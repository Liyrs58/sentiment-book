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
    expect(marketCutoffForMonth("2024-04")).toBe("2024-04-30");
  });

  it("one-period lag maps allocation month to next return month", () => {
    expect(CONSTRAINTS.decisionLagMonths).toBe(1);
    expect(returnMonthForAllocation("2024-05")).toBe("2024-06");
    expect(returnMonthForAllocation("2024-12")).toBe("2025-01");
  });

  it("article after month-end cutoff rolls to next allocation month", () => {
    expect(tradableAllocationMonth("2024-05-15")).toBe("2024-05");
  });

  it("excludes future articles from earlier allocations", () => {
    const articles = [
      { id: "a", date: "2024-03-10", month: "2024-03" },
      { id: "b", date: "2024-05-01", month: "2024-05" },
      { id: "c", date: "2024-04-30", month: "2024-04" },
    ];
    const eligible = articlesForAllocationMonth(articles, "2024-04");
    expect(eligible.map((x) => x.id).sort()).toEqual(["a", "c"]);
    assertNoFutureArticles(eligible, marketCutoffForMonth("2024-04"));
    expect(() =>
      assertNoFutureArticles(articles, marketCutoffForMonth("2024-04"))
    ).toThrow(/Future leak/);
  });

  it("no future article dated after cutoff enters April book", () => {
    const articles = [
      { id: "early", date: "2024-04-02", month: "2024-04" },
      { id: "future", date: "2024-05-02", month: "2024-05" },
    ];
    const eligible = articlesForAllocationMonth(articles, "2024-04");
    expect(eligible.some((a) => a.id === "future")).toBe(false);
    for (const a of eligible) {
      expect(a.date <= marketCutoffForMonth("2024-04")).toBe(true);
    }
  });
});
