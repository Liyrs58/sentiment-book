# Independent technical audit — Sentiment Book

**Reviewed:** 2026-09-21. This report describes the branch as checked in, including its local hardening changes.

## Active data paths

| Path | Source and status |
| --- | --- |
| Default headlines | Synthetic records from `lib/corpus.ts`; visible sources are clearly synthetic and records carry `sourceType`, `generated`, and `dataAsOf`. The separate editorial corpus is empty. |
| Default sentiment | Three-class financial lexicon baseline; scored rows identify `scoredBy`. Optional ProsusAI/FinBERT requires an explicit model/token. |
| Default market | Seeded simulated tape (`lib/market.ts`) marked `SIMULATED_MARKET_TAPE`; derived performance is not empirical evidence. |
| Historical research code | Timestamped monthly-close/event loaders and a costed one-month-lag backtest exist. They fail closed because `data/real/yahoo-monthly-2024-2025.json` and `data/real/events-gdelt-sec.json` are absent. |
| Allocator labels | Inspectable heuristic mixers, not trained SB3/PyTorch policies. |
| Trading | Paper only; `LIVE_TRADING` is false. |

## Verified corrections

- Synthetic stories use synthetic publisher labels. `components/news-wire.tsx` offers no FT, Reuters, WSJ, or Bloomberg masthead.
- Offline scoring is accurately called a three-class financial lexicon baseline.
- The monthly event path requires zoned timestamps, uses a 16:00 America/New_York month-end proxy, moves after-cutoff stories to the next allocation month, and applies that allocation to the following return month.
- OOS results are computed on the OOS curve slice. One-way cost is charged against half-L1 turnover.
- Tests cover cutoff/future/missing timestamps, one-period lag, absent-fixture fail-closed behavior, and synthetic provenance.

## Remaining limits

The historical path is **not reproducible** without its missing input files; its checked-in `manifest.json` and `metrics.json` now say `NOT_REPRODUCIBLE` and contain no performance numbers. No historical alpha, source licensing, or Yahoo retrieval metadata can be verified from this branch. Monthly cutoff timing is a proxy and does not implement exchange calendars. Default synthetic headlines and simulated prices cannot support predictive-alpha claims.
