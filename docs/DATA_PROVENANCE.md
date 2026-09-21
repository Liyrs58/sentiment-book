# Data provenance

| Dataset | Kind | Location | Notes |
| --- | --- | --- | --- |
| Editorial + research headlines | **synthetic** | `lib/news.ts`, `lib/corpus.ts` | Sources: Demo Financial Wire / Synthetic Research Feed / Simulated Market News |
| Seeded market path | **SIMULATED MARKET TAPE** | `lib/market.ts` | Mulberry32 seed; not Yahoo history |
| Yahoo monthly closes | **MISSING** | Expected at `data/real/yahoo-monthly-2024-2025.json` | Not present in this branch; historical backtest cannot run |
| GDELT / SEC / curated events | **MISSING** | Expected at `data/real/events-gdelt-sec.json` | Not present in this branch; no historical event performance is reproducible |

## Article fields

- `sourceType`: `synthetic` | `external` | `manually-curated`
- `dataAsOf`: ISO date
- `generated`: boolean
- `scoredBy`: `lexicon` | `finbert-local` | `finbert-hf` (on scored rows)

## Forbidden attributions

Synthetic or demo content must **not** use FT, Reuters, WSJ, or Bloomberg as `source`.
