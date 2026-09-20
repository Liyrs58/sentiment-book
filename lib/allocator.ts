import { ASSET_BY_ID, ASSET_IDS, EQUAL_WEIGHT } from "./assets";
import { monthSentiment } from "./aggregate";
import { metricsByMonth } from "./market";
import { NEWS_BY_ID } from "./news";
import type {
  AgentOutput,
  AllocationSnapshot,
  FinbertScores,
  RiskProfile,
  WeightMap,
} from "./types";

const MIN_W = 0.012;
const MAX_W = 0.2;

function softmax(values: number[], temperature = 0.55): number[] {
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp((v - max) / temperature));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

function project(raw: WeightMap): WeightMap {
  const ids = ASSET_IDS;
  let w = Object.fromEntries(
    ids.map((id) => [id, Math.min(MAX_W, Math.max(MIN_W, raw[id] ?? MIN_W))])
  );
  for (let k = 0; k < 8; k += 1) {
    const sum = ids.reduce((a, id) => a + w[id], 0);
    w = Object.fromEntries(ids.map((id) => [id, w[id] / sum]));
    let overflow = 0;
    for (const id of ids) {
      if (w[id] > MAX_W) {
        overflow += w[id] - MAX_W;
        w[id] = MAX_W;
      }
      if (w[id] < MIN_W) {
        overflow -= MIN_W - w[id];
        w[id] = MIN_W;
      }
    }
    if (Math.abs(overflow) < 1e-8) break;
    const free = ids.filter((id) => w[id] > MIN_W + 1e-9 && w[id] < MAX_W - 1e-9);
    const freeSum = free.reduce((a, id) => a + w[id], 0);
    if (free.length === 0 || freeSum <= 0) break;
    for (const id of free) {
      w[id] += overflow * (w[id] / freeSum);
    }
  }
  const sum = ids.reduce((a, id) => a + w[id], 0);
  return Object.fromEntries(ids.map((id) => [id, w[id] / sum]));
}

function mix(a: WeightMap, b: WeightMap, t: number): WeightMap {
  return project(
    Object.fromEntries(ASSET_IDS.map((id) => [id, (1 - t) * a[id] + t * b[id]]))
  );
}

function equalWeights(): WeightMap {
  return Object.fromEntries(ASSET_IDS.map((id) => [id, EQUAL_WEIGHT]));
}

function mean(xs: number[]) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

function agent(
  id: string,
  tier: AgentOutput["tier"],
  family: AgentOutput["family"],
  label: string,
  algorithm: string,
  note: string,
  weights: WeightMap
): AgentOutput {
  return { id, tier, family, label, algorithm, note, weights };
}

export function tiltRisk(weights: WeightMap, profile: RiskProfile): WeightMap {
  if (profile === "balanced") return project(weights);
  const scaled: WeightMap = {};
  for (const id of ASSET_IDS) {
    const equity = ASSET_BY_ID[id]?.assetClass === "Equities";
    let f = 1;
    if (profile === "offensive") {
      f = equity ? 1.28 : 0.62;
      if (id === "IXIC" || id === "KS11") f *= 1.12;
      if (id === "GC" || id === "SI") f *= 0.82;
    } else {
      f = equity ? 0.78 : 1.42;
      if (id === "GC") f *= 1.22;
      if (id === "IXIC") f *= 0.88;
    }
    scaled[id] = (weights[id] ?? MIN_W) * f;
  }
  return project(scaled);
}

export function allocate(options: {
  month: string;
  shockArticleId?: string | null;
  liveShock?: {
    ticker: string;
    scores: FinbertScores;
    headline?: string;
  } | null;
}): AllocationSnapshot {
  const month = options.month;
  const book = metricsByMonth();
  const months = Object.keys(book).sort();
  const idx = months.indexOf(month);
  const prev = book[idx > 0 ? months[idx - 1] : month];

  const extraArticle = options.shockArticleId
    ? NEWS_BY_ID[options.shockArticleId]
    : undefined;
  const extra = options.liveShock
    ? {
        id: "live-desk",
        ticker: options.liveShock.ticker,
        scores: options.liveShock.scores,
        headline: options.liveShock.headline ?? "Desk-scored print",
      }
    : extraArticle;
  const extraArg = extra
    ? { ticker: extra.ticker, scores: extra.scores, weight: 3 }
    : undefined;
  const { sentiment } = monthSentiment(month, extraArg);

  const ids = ASSET_IDS;
  const mom3 = ids.map((id) => {
    let acc = 0;
    for (let k = Math.max(0, idx - 2); k <= idx; k += 1) {
      acc += book[months[k]]?.returns[id] ?? 0;
    }
    return acc;
  });
  const sharpes = ids.map((id) => prev.sharpe[id] ?? 0);
  const vols = ids.map((id) => Math.max(prev.vol[id] ?? 0.15, 0.06));
  const sents = ids.map((id) => sentiment[id] ?? 0);

  const momentum = project(
    Object.fromEntries(ids.map((id, i) => [id, softmax(mom3, 0.12)[i]]))
  );
  const riskParity = project(
    Object.fromEntries(ids.map((id, i) => [id, 1 / vols[i]]))
  );
  const quality = project(
    Object.fromEntries(ids.map((id, i) => [id, softmax(sharpes, 1.35)[i]]))
  );
  const nlpRaw = project(
    Object.fromEntries(
      ids.map((id, i) => [id, softmax(sents.map((s) => s * 1.4), 0.42)[i]])
    )
  );
  const nlpVol = project(
    Object.fromEntries(
      ids.map((id, i) => {
        const z = (sentiment[id] ?? 0) / (1 + vols[i]);
        return [id, Math.max(z + 0.15, 0.01)];
      })
    )
  );

  const metaMarket = mix(mix(momentum, riskParity, 0.42), quality, 0.22);
  const metaNlp = mix(nlpRaw, nlpVol, 0.32);

  const avgAbs = mean(sents.map(Math.abs));
  const avgVol = mean(vols);
  const volZ = (avgVol - 0.16) / 0.05;
  let alpha = 0.3 + 0.5 * avgAbs - 0.12 * volZ;
  alpha = Math.min(0.72, Math.max(0.2, alpha));

  const superWeights = mix(metaMarket, metaNlp, alpha);
  const commodities =
    superWeights.GC + superWeights.SI + superWeights.CL;
  const regime: AllocationSnapshot["regime"] =
    alpha > 0.48 && avgAbs > 0.28
      ? "risk-on"
      : avgVol > 0.2 || commodities > 0.28
        ? "risk-off"
        : "mixed";

  const agents: AgentOutput[] = [
    agent(
      "ppo-mkt",
      1,
      "market",
      "PPO · momentum",
      "PPO stand-in",
      "Softmax of 3-month compounded returns (long-only).",
      momentum
    ),
    agent(
      "sac-mkt",
      1,
      "market",
      "SAC · risk parity",
      "SAC stand-in",
      "Inverse-volatility weights, capped and renormalised.",
      riskParity
    ),
    agent(
      "ddpg-nlp",
      1,
      "nlp",
      "DDPG · FinBERT",
      "DDPG stand-in",
      "Softmax of monthly S = mean(P_pos − P_neg).",
      nlpRaw
    ),
    agent(
      "td3-nlp",
      1,
      "nlp",
      "TD3 · sentiment / vol",
      "TD3 stand-in",
      "NLP observation vector: sentiment scaled by realised vol.",
      nlpVol
    ),
    agent(
      "meta-mkt",
      2,
      "meta-market",
      "Data meta-agent",
      "3-layer MLP stand-in",
      "Blends momentum, risk-parity and Sharpe specialists.",
      metaMarket
    ),
    agent(
      "meta-nlp",
      2,
      "meta-nlp",
      "NLP meta-agent",
      "3-layer MLP stand-in",
      "Blends raw FinBERT weights with vol-adjusted scores.",
      metaNlp
    ),
    agent(
      "super",
      3,
      "super",
      "Super-agent",
      "Lookahead mixer",
      `Cross-modal mix. α_NLP = ${(alpha * 100).toFixed(0)}%. Long-only, no leverage, max 20%.`,
      superWeights
    ),
  ];

  const snapshot: AllocationSnapshot = {
    month,
    alpha,
    regime,
    agents,
    superWeights,
    equalWeights: equalWeights(),
  };

  if (extra) {
    const baseline = allocate({ month });
    snapshot.preShockWeights = baseline.superWeights;
    snapshot.shock = {
      articleId: extra.id,
      ticker: extra.ticker,
      headline: extra.headline,
      signedDelta: extra.scores.positive - extra.scores.negative,
    };
  }

  return snapshot;
}
