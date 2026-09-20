# Sentiment Book — Quant Audit

**Date:** 2026-09-21 (Europe/London)  
**Repo:** Liyrs58/sentiment-book  
**Scope:** Implemented vs synthetic vs stub; publisher-name misuse; FinBERT labeling; market tape; temporal alignment; tests/CI.

## Summary

The desk is a **paper-only research UI** driven by an in-repo **synthetic sample corpus** and a **seeded simulated market tape**. Portfolio constraints and the one-month lagged walk-forward are implemented correctly. Default scoring is a **three-class financial lexicon**, not ProsusAI FinBERT. Several UI/docs strings previously overstated FinBERT equivalence and used real publisher mastheads (FT/Reuters/WSJ/Bloomberg) for synthetic copy.

| Severity | Finding | Status after this upgrade |
| --- | --- | --- |
| **Critical** | Synthetic articles attributed to FT/Reuters/WSJ/Bloomberg | Fixed — renamed + provenance |
| **Critical** | Default scorer called “FinBERT equivalent” | Fixed — lexicon baseline wording |
| **Critical** | Seeded tape presented without SIMULATED label | Fixed — explicit tape badge |
| **Critical** | No genuine-data OOS path with costs/turnover | Added — `lib/real-data*` + experiment |
| **Non-critical** | RL agent names are heuristic mixers | Documented (unchanged) |
| **Non-critical** | Live scrape / Yahoo paper dump stubbed | Documented; real Yahoo fixture added |
| **Non-critical** | No Vitest/CI offline tests | Added |

---

## 1. Implemented (real code paths)

| Piece | Location | Notes |
| --- | --- | --- |
| Lexicon → 3-class softmax → \(S=P_+-P_-\) | `lib/sentiment.ts` | Always available offline |
| Optional HF FinBERT / local dump | `lib/sentiment.ts`, `scripts/score-finbert.mjs` | Only when token/dump present |
| Monthly \(S_t\) aggregation (Alg. 1) | `lib/aggregate.ts` | Mean signed score per asset-month |
| Constraints: long-only, lev 1, floor 1.2%, cap 20%, Σ=1 | `lib/constraints.ts` | Preserved |
| Month-end rebalance + **1-month decision lag** | `lib/backtest.ts`, `lib/constraints.ts` | Weights from \(t\) → returns \(t+1\) |
| Allocator hierarchy (inspectable mixers) | `lib/allocator.ts` | Not trained SB3/PyTorch |
| Desk UI + optional paper Alpaca sleeve | `components/*`, `lib/alpaca.ts` | `LIVE_TRADING` false |
| Pipeline report real/stub lists | `lib/pipeline.ts` | Honest inventory |

## 2. Synthetic (demo content, not market news)

| Piece | Location | Notes |
| --- | --- | --- |
| Editorial desk headlines | `lib/news.ts` `EDITORIAL_CORPUS` | Hand-written; **synthetic** |
| Filler research prints | `lib/corpus.ts` `researchArticles()` | Template-generated; **synthetic** |
| Seeded daily/monthly returns | `lib/market.ts` | Mulberry32 + hand shocks — **SIMULATED MARKET TAPE** |
| Sample equity path on desk | `runBacktest()` | On simulated tape only |

Synthetic publishers must **not** use FT/Reuters/WSJ/Bloomberg names. After upgrade: **Demo Financial Wire**, **Synthetic Research Feed**, **Simulated Market News**, plus `sourceType` / `dataAsOf` / `generated` / `scoredBy`.

## 3. Stub / optional

| Piece | Status |
| --- | --- |
| ProsusAI/finbert weights | Stub unless HF token or ONNX dump |
| SB3 PPO/SAC/DDPG/TD3 | Labels only — heuristic mixers |
| Google News live scrape | Off (`lib/scrape.ts`) |
| Paper’s 2003–2024 yfinance dump | Not shipped; replaced for research by committed Yahoo monthly fixture under `data/real/` |
| HARLF paper 26% CAGR / Sharpe 1.2 | **Not claimed** |
| NVIDIA NIM PM notes | Optional prose only |

## 4. Publisher-name misuse (pre-fix)

- `lib/news.ts` and `lib/corpus.ts` assigned **FT, Reuters, WSJ, Bloomberg**, SCMP, etc. to synthetic headlines.
- `components/news-wire.tsx` masthead listed FT/Reuters/WSJ/Bloomberg as if outlets were live.

**Impact:** Readers could infer licensed wire content. **Fix:** rename sources; UI provenance badges; docs.

## 5. FinBERT-equivalent mislabeling (pre-fix)

- Comments/notes: “Lightweight FinBERT equivalent”, “documented FinBERT equivalent”.
- README: “FinBERT-style sentiment” / “lightweight equivalent”.

**Accurate wording:** three-class financial lexicon baseline; FinBERT-compatible `{positive,negative,neutral}` interface. Say **FinBERT** only when `scoredBy` is `finbert-local` or `finbert-hf` (ProsusAI weights).

## 6. Synthetic tape

`lib/market.ts` builds returns from drift/vol/beta + `MONTH_FACTOR` / `ASSET_SHOCKS` + Gaussian noise (seed `25071856`). Independent of scorer by design. Must be labeled **SIMULATED MARKET TAPE**, never “Yahoo historical”.

## 7. Temporal alignment

**Sample path:** articles carry `date`/`month`; allocation uses month-\(t\) sentiment; backtest applies weights to \(t+1\) returns — **correct lag**, but on synthetic tape.

**Gaps (pre-fix):** no market-cutoff / tradable-time helpers; no test that future articles cannot enter earlier allocations; no genuine external event timestamps.

**After upgrade:** `lib/temporal.ts` + Vitest coverage; real-data path filters events by cutoff before allocation month.

## 8. Tests / CI (pre-fix)

- No Vitest suite; `npm run qa` is Playwright clickthrough (needs server).
- CI workflows were lockfile/assemble helpers, not unit tests.

**After upgrade:** Vitest offline tests + GitHub Actions `ci.yml` (lint/build/test, no network required for unit tests).

## 9. Critical vs non-critical

**Critical (correctness / integrity):** publisher misattribution; FinBERT overclaim; unlabeled simulated tape; missing lag/future-leak tests on research path; fabricating live performance.

**Non-critical:** RL naming cosplay; optional scrape; PM mock notes; Alpaca sleeve off by default.

## 10. Preserved by design

- Portfolio constraints and lagged walk-forward (unless a correctness bug is found — none found in lag math).
- Paper-only safety (`LIVE_TRADING` false).
- No fabricated performance claims; no implication that synthetic news is from FT/Reuters/WSJ/Bloomberg.
