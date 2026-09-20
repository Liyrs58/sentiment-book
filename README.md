# Sentiment Book

A Next.js laboratory desk for **sentiment-driven portfolio allocation**, laid out as an FT/Economist-style book: news wire on the left, model allocations and an equity path on the right. Financial-news prints are scored in the FinBERT style, then passed through a three-tier allocator inspired by HARLF. The demo runs fully offline from bundled copy and precomputed class probabilities.

It is a **focused, inspectable demo** of the paper’s *structure* — news → scores → hierarchical weights → monthly equity path — not a reproduction of the authors’ 2018–2024 market backtest.

## Run

```bash
npm install
npm run dev
```

App Router, TypeScript, Tailwind. Open the printed URL (this repo pins the dev server to port **43173**).

Paper mode is the default: bundled headlines, FinBERT-like `{positive, negative, neutral}` triples, a 14-name book, monthly rebalance. **No API keys.** `Score a print` uses the offline lexicon in the browser.

## What you can do on the desk

- Step the **edition** date (January 2024 – December 2025).
- Filter the **wire** by source chips, name, and sentiment.
- Click a **headline** to apply a news shock. The printed score is display-only.
- Change **Model** and **Risk profile**; hit **Rebalance** to mark the book and step one month.
- Hover or click the **equity path**; use the legend to toggle series.

## QA checklist (every control)

Run `npm run dev` with no env files. Click through the table. Nothing is decorative: each control must change the wire, the bars, or the path. Repeatable headless pass: `npm run qa` (dev server already running).

| Control | Where | What must happen |
| --- | --- | --- |
| Edition date | Left masthead | Wire, weights, YTD, and chart window follow the month. |
| All Sources | News wire masthead chips (FT / Reuters / WSJ / Bloomberg) + More | List shows only that outlet. Empty → **Clear filters**. |
| All names | News wire | Editorial names (S&P 500, Nasdaq, Dow) with ticker secondary. |
| Sentiment chips All / Positive / Neutral / Negative | Under News wire | List filters by `S = P_pos − P_neg`. Selected Positive is the one teal state; other chips are ink underline. |
| Printed score | Each print | Display only — does not filter. |
| Headline / dek | Each print | Applies a news shock. Bars show Δ vs the unshocked book. Click again to drop it. |
| Clear shock | Allocations (when a shock is on) | Restores pre-shock weights. |
| Score a print → Apply shock | Wire footer | Offline lexicon scores the headline (no keys). Book tilts. |
| Model: Base Case / NLP meta / Data meta / Equal weight | Right header | Allocation bars switch immediately. |
| Risk profile: Balanced / Offensive / Defensive | Allocations | Offensive lifts equities (esp. Nasdaq); Defensive lifts gold/commodities. |
| Rebalance | Right header | Commits the current model + risk, advances one edition, clears shock. On Dec 2025, marks the book and says there is no later edition. |
| Allocation sleeve (Equities, Gold, …) | Bars | Filters the wire to that sleeve. Click again to clear. |
| Equity path | Chart | Hover shows a tooltip. Click a month to open that edition. |
| Legend: Model Portfolio / Equal-weight book | Under chart | Toggles that series on or off. |

If a source + tone pair is empty, **Clear filters** is the recovery path — not a dead end.

## How this maps to HARLF

[Coriat & Benhamou, *HARLF: Hierarchical Reinforcement Learning and Lightweight LLM-Driven Sentiment Integration for Financial Portfolio Optimization*](https://arxiv.org/abs/2507.18560), arXiv:2507.18560 (IJCAI 2025 FinLLM workshop).

| Paper | This desk |
| --- | --- |
| Google News scrape, ~10 articles / name / month | Bundled wire, mapped to the same 14 names |
| FinBERT `S_t = mean(P_pos − P_neg)` | Precomputed triples; same identity |
| Monthly observation: Sharpe, Sortino, Calmar, MDD, vol, sentiment | Monthly metrics from a seeded tape; sentiment from the wire |
| Base agents: PPO, SAC, DDPG, TD3 on market **or** NLP | Heuristic specialists with those labels (no SB3 training) |
| Data meta-agent + NLP meta-agent | Convex blends of the specialists |
| Super-agent, lookahead mix, long-only, no leverage | Mix weight `α_NLP` from |S| and realised vol; floor 1.2%, cap 20% |
| Book: S&P 500, Nasdaq, Dow, CAC 40, FTSE 100, Euro Stoxx 50, Hang Seng, Shanghai Composite, Sensex, Nifty 50, KOSPI, gold, silver, WTI | Same 14 |
| Reported 26% CAGR / Sharpe 1.2 on 2018–24 | **Not claimed here.** Sample path is synthetic, with a mild sentiment overlay so the NLP sleeve is not noise. |

Related code and model:

- [franjgs/llm-rl-finance-trader](https://github.com/franjgs/llm-rl-finance-trader) — LLM news sentiment + RL allocation.
- [ProsusAI/finBERT](https://github.com/ProsusAI/finBERT) — Araci (2019), financial sentiment BERT.

## Plug in real FinBERT later

1. Create `.env.local` with a Hugging Face token:

   ```
   HF_TOKEN=hf_...
   ```

2. Restart the dev server. Optional: the “Score a print” box already scores offline. `POST /api/sentiment` calls FinBERT when `HF_TOKEN` is set and otherwise returns the same lexicon.

3. For a local GPU/CPU model, keep the route shape `{ scores: { positive, negative, neutral } }` and point the fetch at your inference server, or replace the bundled triples in `lib/news.ts` with a batch dump from FinBERT (the rest of the desk will not care).

4. To swap the heuristic mixer for trained policies, implement `allocate()` in `lib/allocator.ts` as a wrapper around exported SB3/PyTorch weights. The UI only consumes `WeightMap`s.

## Layout of the code

```
app/page.tsx                  Desk shell
app/api/sentiment/route.ts    Optional FinBERT / lexicon
lib/news.ts                   Bundled wire + scores
lib/market.ts                 Seeded monthly tape + metrics
lib/allocator.ts              Three-tier heuristic
lib/backtest.ts               Walk-forward mark-to-market
components/desk.tsx           Masthead, wire, board, charts
```

## Licence

Demo code for this repository. Paper, FinBERT, and third-party marks remain with their authors.
