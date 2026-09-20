# Limitations

1. **Default desk path is synthetic** — headlines and market tape are demo constructs.
2. **Lexicon ≠ FinBERT** — default scorer is a three-class financial lexicon baseline.
3. **RL agent labels are inspectable mixers**, not trained SB3/PyTorch policies.
4. **Genuine-data event coverage is sparse** — GDELT rate limits, RSS parse gaps, curated chronology is paraphrased.
5. **Monthly resolution** — no intraday tradable-time refinement beyond month-end cutoff.
6. **Transaction costs are stylized** — constant bps on turnover.
7. **Paper-only** — `LIVE_TRADING` is false; Alpaca sleeve is optional and off by default.
8. **No claim** of HARLF paper CAGR/Sharpe or of matching licensed newswire content.
