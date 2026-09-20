# Validation

## Offline checks (CI)

```bash
npm ci
npm run lint
npm test
npm run build
npm run pipeline
```

## Test coverage

| Suite | Asserts |
| --- | --- |
| `tests/temporal.test.ts` | Cutoff, lag, no future articles |
| `tests/provenance.test.ts` | Publisher rename, lexicon labeling, SIMULATED tape |
| `tests/constraints-lag.test.ts` | Floor/cap/sum, walk-forward lag rule |
| `tests/genuine-backtest.test.ts` | Real fixture load, costed backtest runs |

## FinBERT vs lexicon (optional)

If `data/finbert-cache.json` exists (from `npm run score:finbert`):

```bash
npm run compare:finbert-lexicon
```

Reports agreement rate on a small sample. **Does not claim equality.**
