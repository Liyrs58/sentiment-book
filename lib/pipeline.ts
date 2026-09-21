import { allocate } from "./allocator";
import { ASSET_BY_ID, ASSET_IDS, deskName } from "./assets";
import { runBacktest } from "./backtest";
import { CONSTRAINTS, assertBook } from "./constraints";
import { getRawCorpus, getScoredCorpus, resetScoredCorpus } from "./corpus";
import { hydrateFinbertCache } from "./finbert-cache";
import { activeBackend, signedScore } from "./sentiment";
import type { PipelineReport } from "./types";

/**
 * Offline research loop: score the shipped sample corpus → monthly S_t →
 * constrained weights → walk-forward equity curve.
 *
 * Live scrape is optional and is not required for this path.
 */
export function runResearchPipeline(month = "2025-05"): PipelineReport {
  hydrateFinbertCache();
  resetScoredCorpus();
  const { backend, note } = activeBackend();
  const scored = getScoredCorpus();
  const raw = getRawCorpus();
  if (scored.length !== raw.length) {
    throw new Error("Scorer dropped articles.");
  }
  if (scored.length < 50) {
    throw new Error("Sample corpus too small to drive the pipeline.");
  }

  const snapshot = allocate({ month });
  const weights = assertBook(snapshot.superWeights);
  const backtest = runBacktest();

  if (backtest.curve.length < 3) {
    throw new Error("Backtest did not produce an equity curve.");
  }
  const last = backtest.curve[backtest.curve.length - 1];
  if (!(last.harlf > 0) || !(last.equal > 0)) {
    throw new Error("Equity curve left the positive orthant.");
  }

  const sampleScores = scored
    .filter((a) => a.desk)
    .slice(0, 6)
    .map((a) => ({
      id: a.id,
      headline: a.headline,
      scores: a.scores,
      signed: signedScore(a.scores),
    }));

  return {
    backend,
    backendNote: note,
    articlesScored: scored.length,
    sampleScores,
    month,
    weights: ASSET_IDS.map((id) => ({
      id,
      name: deskName(ASSET_BY_ID[id], id),
      weight: weights[id],
    })),
    backtest,
    real: [
      "Sample (SYNTHETIC) corpus headlines scored by lexicon baseline or optional ProsusAI FinBERT.",
      "Monthly S_t = mean(P_pos − P_neg) per HARLF Alg. 1.",
      `Constrained allocation: long-only, leverage 1, floor ${CONSTRAINTS.minWeight}, cap ${CONSTRAINTS.maxWeight}, sum to 1.`,
      "Walk-forward backtest: weights from month t applied to month t+1 returns on the SIMULATED MARKET TAPE.",
      "Desk wire, filters, shocks, and equity path consume the same pipeline.",
      "Pipeline cache persists to @vercel/blob when BLOB_READ_WRITE_TOKEN is set, else committed data/pipeline-cache.json, else /tmp.",
    ],
    stubbed: [
      "ProsusAI/finbert weights — optional; default is three-class financial lexicon baseline (not FinBERT).",
      "Stable-Baselines3 PPO/SAC/DDPG/TD3 and PyTorch meta-agents — heuristic mixers with those labels.",
      "Google News live scrape — optional; sample corpus is the default.",
      "Default desk tape — SIMULATED MARKET TAPE (seeded). Historical fixture loader exists, but the required data/real/ fixtures are missing from this branch.",
      "HARLF reported 26% CAGR / Sharpe 1.2 on 2018–24 — not claimed here.",
      "Alpaca paper sleeve — optional, PAPER_BROKER=off by default; not required for HARLF research.",
    ],
  };
}
