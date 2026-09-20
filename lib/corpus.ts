import { ASSET_BY_ID, ASSET_IDS, SAMPLE_MONTHS, deskName } from "./assets";
import { EDITORIAL_CORPUS } from "./news";
import { scoreHeadlineSync } from "./sentiment";
import type { NewsArticle, RawArticle } from "./types";

const RESEARCH_SOURCES = [
  "FT",
  "Reuters",
  "WSJ",
  "Bloomberg",
  "SCMP",
  "Nikkei",
  "Les Echos",
] as const;

const POS_HEAD = [
  (n: string) => `${n} rallies as traders bid the tape into the close`,
  (n: string) => `${n} surges after a stronger-than-feared print`,
  (n: string) => `${n} lifts to a high as stimulus talk rebuilds the bid`,
  (n: string) => `${n} outperforms as rate-cut odds firm`,
];
const NEG_HEAD = [
  (n: string) => `${n} slumps as tariff talk knocks risk appetite`,
  (n: string) => `${n} tumbles; the worst session in months on thin books`,
  (n: string) => `${n} slides after the print misses and guidance disappoints`,
  (n: string) => `${n} wobbles as a growth scare returns to the tape`,
];
const NEU_HEAD = [
  (n: string) => `${n} holds a narrow range; the tape stays data-dependent`,
  (n: string) => `${n} consolidates after the prior move; volumes quiet`,
  (n: string) => `${n} little changed as positioning stays measured`,
];
const POS_DEK = [
  "Flows follow the headline. Breadth is secondary.",
  "A relief bid, not a regime change. Still, the weight wants the name.",
  "Official commentary stays constructive. Positioning was light.",
];
const NEG_DEK = [
  "Liquidity, not valuation, is the constraint for a session.",
  "The move is sharp. Follow-through is the open question.",
  "Risk is offered first. The fundamental argument comes later.",
];
const NEU_DEK = [
  "Nothing in the print forces a reallocation on its own.",
  "Dealers fade extremes. The book stays two-way.",
  "A holding pattern until the next scheduled release.",
];

/** Month-level tape tone used only to pick which lexical template to emit. */
const MONTH_TONE: Record<string, -1 | 0 | 1> = {
  "2024-01": 1,
  "2024-02": 1,
  "2024-03": 1,
  "2024-04": -1,
  "2024-05": 1,
  "2024-06": -1,
  "2024-07": 0,
  "2024-08": -1,
  "2024-09": 1,
  "2024-10": 0,
  "2024-11": 1,
  "2024-12": 0,
  "2025-01": -1,
  "2025-02": 1,
  "2025-03": 1,
  "2025-04": -1,
  "2025-05": 1,
  "2025-06": 1,
  "2025-07": 1,
  "2025-08": 0,
  "2025-09": 1,
  "2025-10": 1,
  "2025-11": 0,
  "2025-12": 1,
};

const ASSET_TONE: Record<string, Record<string, -1 | 0 | 1>> = {
  "2024-01": { HSI: -1, SSEC: -1, GC: 1 },
  "2024-02": { IXIC: 1, KS11: 1, SSEC: -1 },
  "2024-03": { GC: 1, CL: 1 },
  "2024-04": { GSPC: -1, DJI: -1, CL: 0 },
  "2024-05": { NSEI: 1, BSESN: 1 },
  "2024-06": { FCHI: -1, SX5E: -1, SI: -1 },
  "2024-07": { FCHI: 1, CL: -1 },
  "2024-08": { GSPC: -1, KS11: -1, IXIC: -1, GC: 1 },
  "2024-09": { HSI: 1, SSEC: 1, GSPC: 1 },
  "2024-10": { HSI: -1, CL: 0, DJI: 1 },
  "2024-11": { GSPC: 1, SSEC: -1, IXIC: 0 },
  "2024-12": { GC: 1, FTSE: 0 },
  "2025-01": { IXIC: -1, KS11: -1, SSEC: 1 },
  "2025-02": { GC: 1, SI: 1 },
  "2025-03": { SX5E: 1, FCHI: 1, FTSE: 1 },
  "2025-04": { GSPC: -1, HSI: -1, CL: -1, GC: 0 },
  "2025-05": { GSPC: 1, IXIC: 1, NSEI: 1 },
  "2025-06": { CL: 1, GC: 1, SX5E: 0 },
  "2025-07": { IXIC: 1, KS11: 1, DJI: 1 },
  "2025-08": { GSPC: 1, FTSE: -1 },
  "2025-09": { GSPC: 1, HSI: -1, BSESN: 1 },
  "2025-10": { GC: 1, SI: 1, SSEC: 0 },
  "2025-11": { GSPC: 1, CL: -1, SX5E: 0 },
  "2025-12": { GC: 1, NSEI: 1, DJI: 0 },
};

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length];
}

function researchArticles(): RawArticle[] {
  const covered = new Set(
    EDITORIAL_CORPUS.map((a) => `${a.month}:${a.ticker}`)
  );
  const out: RawArticle[] = [];
  for (const month of SAMPLE_MONTHS) {
    const [y, m] = month.split("-").map(Number);
    for (let i = 0; i < ASSET_IDS.length; i += 1) {
      const id = ASSET_IDS[i];
      const key = `${month}:${id}`;
      if (covered.has(key)) continue;
      const asset = ASSET_BY_ID[id];
      const name = deskName(asset);
      const tone = ASSET_TONE[month]?.[id] ?? MONTH_TONE[month] ?? 0;
      const heads = tone > 0 ? POS_HEAD : tone < 0 ? NEG_HEAD : NEU_HEAD;
      const deks = tone > 0 ? POS_DEK : tone < 0 ? NEG_DEK : NEU_DEK;
      const day = 6 + ((i * 3) % 18);
      const date = `${month}-${String(day).padStart(2, "0")}`;
      const n = 2 + (i % 2);
      for (let k = 0; k < n; k += 1) {
        const headline = pick(heads, i + k + m)(name);
        const dek = pick(deks, i + k + y);
        out.push({
          id: `rs-${month}-${id}-${k}`,
          date,
          month,
          ticker: id,
          source: pick(RESEARCH_SOURCES, i + k + m),
          headline,
          dek,
          desk: false,
        });
      }
    }
  }
  return out;
}

let rawCache: RawArticle[] | null = null;

/** Full sample corpus: editorial desk + generated research prints. No scores. */
export function getRawCorpus(): RawArticle[] {
  if (!rawCache) {
    rawCache = [...EDITORIAL_CORPUS, ...researchArticles()];
  }
  return rawCache;
}

let scoredCache: NewsArticle[] | null = null;

/** Score every corpus headline through the active backend (lexicon unless cached FinBERT). */
export function getScoredCorpus(): NewsArticle[] {
  if (scoredCache) return scoredCache;
  scoredCache = getRawCorpus().map((article) => {
    const text = `${article.headline}. ${article.dek}`;
    const { scores, backend } = scoreHeadlineSync(text);
    return {
      ...article,
      scores,
      scoredBy: backend,
      signed: scores.positive - scores.negative,
    };
  });
  return scoredCache;
}

/** Desk wire: editorial prints only, already scored. */
export function getDeskWire(): NewsArticle[] {
  return getScoredCorpus().filter((a) => a.desk);
}

export function articleById(id: string): NewsArticle | undefined {
  return getScoredCorpus().find((a) => a.id === id);
}
