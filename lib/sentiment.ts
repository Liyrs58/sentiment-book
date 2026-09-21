import type { FinbertScores, ScorerBackend } from "./types";

/** Three-class financial lexicon baseline; this is not a language model. */

const POSITIVE: [string, number][] = [
  ["beats estimates", 1.4],
  ["outperform", 1.2],
  ["rebuilds", 0.9],
  ["stabilize", 0.7],
  ["improves", 1.0],
  ["improve", 0.9],
  ["stimulus", 1.1],
  ["package", 0.5],
  ["insurance", 0.4],
  ["dovish", 1.1],
  ["records", 1.0],
  ["record", 0.95],
  ["surges", 1.3],
  ["surge", 1.2],
  ["rally", 1.2],
  ["relief", 1.0],
  ["clears", 0.7],
  ["strong", 0.9],
  ["cools", 0.8],
  ["cool", 0.7],
  ["beats", 1.1],
  ["beat", 1.0],
  ["gains", 0.9],
  ["gain", 0.8],
  ["lifts", 0.9],
  ["lift", 0.8],
  ["firms", 0.7],
  ["firm", 0.6],
  ["high", 0.35],
  ["bid", 0.55],
  ["cut", 0.35],
  ["cuts", 0.4],
];

const NEGATIVE: [string, number][] = [
  ["gap lower", 1.4],
  ["disappoints", 1.2],
  ["disappoint", 1.1],
  ["downgrade", 1.3],
  ["recession", 1.4],
  ["selloff", 1.3],
  ["tumbles", 1.4],
  ["tumble", 1.3],
  ["hammers", 1.2],
  ["knocks", 1.0],
  ["knock", 0.9],
  ["wobbles", 0.9],
  ["wobble", 0.85],
  ["sticky", 0.8],
  ["panic", 1.3],
  ["crash", 1.4],
  ["worst", 1.2],
  ["fear", 1.0],
  ["scare", 1.0],
  ["slump", 1.2],
  ["slides", 1.0],
  ["slide", 0.95],
  ["slips", 0.85],
  ["slip", 0.8],
  ["misses", 1.1],
  ["miss", 0.95],
  ["tariff", 0.9],
  ["surplus", 0.55],
  ["glut", 0.9],
  ["sold", 0.45],
  ["sags", 1.0],
  ["sag", 0.9],
  ["fades", 0.8],
  ["fade", 0.7],
  ["gapped", 0.9],
];

const NEUTRAL: [string, number][] = [
  ["holds", 0.7],
  ["hold", 0.5],
  ["consolidates", 0.8],
  ["quiet", 0.6],
  ["measured", 0.6],
  ["workmanlike", 0.7],
  ["muted", 0.7],
  ["unchanged", 0.8],
  ["data-dependent", 0.5],
];

function hits(text: string, lexicon: [string, number][]): number {
  const t = text.toLowerCase();
  let w = 0;
  for (const [phrase, weight] of lexicon) {
    if (t.includes(phrase)) w += weight;
  }
  return w;
}

function softmax3(pos: number, neu: number, neg: number): FinbertScores {
  const max = Math.max(pos, neu, neg);
  const ep = Math.exp(pos - max);
  const eu = Math.exp(neu - max);
  const en = Math.exp(neg - max);
  const z = ep + eu + en;
  return {
    positive: Number((ep / z).toFixed(4)),
    negative: Number((en / z).toFixed(4)),
    neutral: Number((eu / z).toFixed(4)),
  };
}

/** Deterministic offline three-class financial lexicon baseline. */
export function lexiconScore(text: string): FinbertScores {
  const pos = hits(text, POSITIVE);
  const neg = hits(text, NEGATIVE);
  const neuHits = hits(text, NEUTRAL);
  const neu = 0.85 + neuHits;
  return softmax3(pos, neu, neg);
}

export function signedScore(scores: FinbertScores): number {
  return scores.positive - scores.negative;
}

export function labelForScore(signed: number): "pos" | "neg" | "neu" {
  if (signed >= 0.18) return "pos";
  if (signed <= -0.18) return "neg";
  return "neu";
}

function fromHfPayload(payload: unknown): FinbertScores | null {
  const row = Array.isArray(payload)
    ? Array.isArray(payload[0])
      ? (payload[0] as { label: string; score: number }[])
      : (payload as { label: string; score: number }[])
    : null;
  if (!row?.length) return null;
  const map = { positive: 0, negative: 0, neutral: 0 };
  for (const item of row) {
    const key = item.label.toLowerCase() as keyof typeof map;
    if (key in map) map[key] = item.score;
  }
  const sum = map.positive + map.negative + map.neutral;
  if (sum <= 0) return null;
  return {
    positive: map.positive / sum,
    negative: map.negative / sum,
    neutral: map.neutral / sum,
  };
}

export type ScoreResult = {
  scores: FinbertScores;
  backend: ScorerBackend;
  note: string;
};

const memoryCache = new Map<string, ScoreResult>();

/** Synchronous score used by the sample-corpus pipeline (lexicon, or in-memory FinBERT dump). */
export function scoreHeadlineSync(text: string): ScoreResult {
  const key = text.trim();
  const hit = memoryCache.get(key);
  if (hit) return hit;
  const result: ScoreResult = {
    scores: lexiconScore(key),
    backend: "lexicon",
    note: "Three-class financial lexicon baseline. Optional ProsusAI/FinBERT scoring requires HF_TOKEN or a local model dump.",
  };
  memoryCache.set(key, result);
  return result;
}

/** Hydrate the in-memory cache from a FinBERT dump (Node pipeline / tests). */
export function loadFinbertDump(
  items: { text: string; scores: FinbertScores }[]
): void {
  for (const item of items) {
    memoryCache.set(item.text, {
      scores: item.scores,
      backend: "finbert-local",
      note: "Cached ProsusAI/finbert (ONNX or HF) dump.",
    });
  }
}

export async function scoreHeadline(text: string): Promise<ScoreResult> {
  const key = text.trim();
  if (key.length < 8) {
    return {
      scores: lexiconScore(key),
      backend: "lexicon",
      note: "Headline too short for model scoring; lexicon baseline used.",
    };
  }
  const cached = scoreHeadlineSync(key);
  if (cached.backend !== "lexicon") return cached;

  const token = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
  if (!token) return cached;

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/ProsusAI/finbert",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: key }),
      }
    );
    if (!response.ok) return cached;
    const scores = fromHfPayload(await response.json());
    if (!scores) return cached;
    const result: ScoreResult = {
      scores,
      backend: "finbert-hf",
      note: "ProsusAI/finbert via Hugging Face Inference API.",
    };
    memoryCache.set(key, result);
    return result;
  } catch {
    return cached;
  }
}

export function activeBackend(): { backend: ScorerBackend; note: string } {
  const probe = scoreHeadlineSync("Gold firms as real rates slip");
  return { backend: probe.backend, note: probe.note };
}
