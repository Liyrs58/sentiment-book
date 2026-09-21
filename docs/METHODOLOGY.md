# Methodology

## Desk demo path (default)

1. **Corpus:** In-repo SYNTHETIC headlines (`lib/news.ts`, `lib/corpus.ts`) with provenance `sourceType=synthetic`, `generated=true`.
2. **Scoring:** Three-class financial lexicon baseline → softmax → \(S = P_+ - P_-\). Optional ProsusAI/finBERT when HF token or local dump is present (`scoredBy` distinguishes).
3. **Aggregation:** Monthly \(S_t\) per asset (HARLF Alg. 1).
4. **Allocation:** Constrained long-only book (floor 1.2%, cap 20%, Σw=1, leverage 1).
5. **Backtest:** Walk-forward on **SIMULATED MARKET TAPE** — weights formed at month \(t\) applied to returns of \(t+1\).

## Historical-data path status

The code contains a loader and backtest for timestamped Yahoo/event fixtures, but `data/real/` and both referenced fixture files are absent from this branch. `npm run experiment:genuine` therefore fails closed and cannot produce reproducible historical results. The checked-in report is a status record, not performance evidence.

If fixtures are supplied, the intended path uses a month-end 16:00 America/New_York cutoff proxy, shifts after-cutoff articles to the next allocation month, applies a one-month decision lag, charges proportional one-way costs on half-L1 turnover, and compares against GSPC and equal weight. Calendar month-end is only a proxy; it does not model exchange holidays or asset-specific closes.

Run: `npm run experiment:genuine` → writes `experiments/genuine-yahoo-gdelt/manifest.json` + `metrics.json`.

## What is not claimed

- Lexicon ≠ FinBERT; agreement is measured separately when a FinBERT dump exists.
- Simulated desk backtest ≠ paper HARLF live results.
- No historical-path performance claim is supported until the missing source data and provenance are committed and the run is reproduced.
