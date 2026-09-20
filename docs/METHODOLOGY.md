# Methodology

## Desk demo path (default)

1. **Corpus:** In-repo SYNTHETIC headlines (`lib/news.ts`, `lib/corpus.ts`) with provenance `sourceType=synthetic`, `generated=true`.
2. **Scoring:** Three-class financial lexicon baseline → softmax → \(S = P_+ - P_-\). Optional ProsusAI/finBERT when HF token or local dump is present (`scoredBy` distinguishes).
3. **Aggregation:** Monthly \(S_t\) per asset (HARLF Alg. 1).
4. **Allocation:** Constrained long-only book (floor 1.2%, cap 20%, Σw=1, leverage 1).
5. **Backtest:** Walk-forward on **SIMULATED MARKET TAPE** — weights formed at month \(t\) applied to returns of \(t+1\).

## Genuine-data research path

1. **Prices:** Yahoo Finance monthly closes committed under `data/real/yahoo-monthly-2024-2025.json` (`tapeKind=REAL_HISTORICAL_DATA`).
2. **Events:** Legal timestamped titles from GDELT Doc API (when available), SEC EDGAR Atom, Fed/ECB public feeds when parseable, plus **manually curated** macro chronology paraphrases — never labeled as FT/Reuters/WSJ/Bloomberg.
3. **Alignment:** `lib/temporal.ts` — market cutoff = month-end; articles after cutoff excluded; one-period decision lag; tests forbid future leaks.
4. **Costs:** Proportional cost on turnover (default 10 bps one-way).
5. **Benchmark:** GSPC monthly return; equal-weight book as secondary reference.
6. **OOS:** Default OOS start `2025-01` (configurable).

Run: `npm run experiment:genuine` → writes `experiments/genuine-yahoo-gdelt/manifest.json` + `metrics.json`.

## What is not claimed

- Lexicon ≠ FinBERT; agreement is measured separately when a FinBERT dump exists.
- Simulated desk backtest ≠ paper HARLF live results.
- Genuine-path metrics are small-sample research outputs with listed limitations.
