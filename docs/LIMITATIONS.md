# Limitations

1. **Default desk path is synthetic** — headlines and market tape are demo constructs.
2. **Lexicon ≠ FinBERT** — default scorer is a three-class financial lexicon baseline.
3. **RL agent labels are inspectable mixers**, not trained SB3/PyTorch policies.
4. **Historical-data path is not reproducible from this branch** — the documented Yahoo and event fixture files are missing.
5. **Monthly resolution** — after-close handling uses a month-end cutoff proxy, not exchange calendars or asset-specific closes.
6. **Transaction costs are stylized** — constant one-way bps on half-L1 turnover.
7. **Paper-only** — `LIVE_TRADING` is false; Alpaca sleeve is optional and off by default.
8. **No claim** of HARLF paper CAGR/Sharpe or of matching licensed newswire content.
