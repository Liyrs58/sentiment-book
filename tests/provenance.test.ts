import { describe, expect, it } from "vitest";
import { getRawCorpus, getScoredCorpus } from "@/lib/corpus";
import { getMarket } from "@/lib/market";
import { scoreHeadlineSync } from "@/lib/sentiment";

const FORBIDDEN = ["FT", "Reuters", "WSJ", "Bloomberg"];
const ALLOWED_SYNTH = [
  "Demo Financial Wire",
  "Synthetic Research Feed",
  "Simulated Market News",
];

describe("provenance", () => {
  it("synthetic corpus never uses FT/Reuters/WSJ/Bloomberg as source", () => {
    for (const a of getRawCorpus()) {
      expect(a.sourceType).toBe("synthetic");
      expect(a.generated).toBe(true);
      expect(a.dataAsOf).toBeTruthy();
      expect(FORBIDDEN).not.toContain(a.source);
      expect(ALLOWED_SYNTH).toContain(a.source);
    }
  });

  it("scored rows expose scoredBy", () => {
    const row = getScoredCorpus()[0];
    expect(row.scoredBy).toMatch(/lexicon|finbert/);
  });

  it("default scorer is lexicon baseline, not FinBERT", () => {
    const r = scoreHeadlineSync("Gold firms as real rates slip");
    expect(r.backend).toBe("lexicon");
    expect(r.note.toLowerCase()).not.toMatch(/finbert equivalent/);
    expect(r.note.toLowerCase()).toMatch(/lexicon/);
  });

  it("desk market tape is labeled SIMULATED", () => {
    expect(getMarket().tapeKind).toBe("SIMULATED_MARKET_TAPE");
  });
});
