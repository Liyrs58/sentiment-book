# Sentiment Book

A research desk for **news → FinBERT-style sentiment → constrained portfolio → walk-forward backtest**, laid out as an FT/Economist book. It implements the *structure* of HARLF (Coriat & Benhamou, 2025) on a shipped sample corpus so the pipeline runs fully offline.

The UI is the desk. The engine is `npm run pipeline`.

## Papers and code

- Benjamin Coriat & Eric Benhamou, [HARLF: Hierarchical Reinforcement Learning and Lightweight LLM-Driven Sentiment Integration for Financial Portfolio Optimization](https://arxiv.org/abs/2507.18560), arXiv:2507.18560 (IJCAI 2025 FinLLM workshop).
- Dogu Araci, [FinBERT: Financial Sentiment Analysis with Pre-trained Language Models](https://arxiv.org/abs/1908.10063), arXiv:1908.10063. Weights: [ProsusAI/finBERT](https://github.com/ProsusAI/finBERT).
- Related trader stack: [franjgs/llm-rl-finance-trader](https://github.com/franjgs/llm-rl-finance-trader).

HARLF identity used here (paper Alg. 1):

\[
S_t = \frac{1}{N}\sum_i \bigl(P_{\text{positive},i} - P_{\text{negative},i}\bigr)
\]

Book: S&P 500, Nasdaq, Dow, CAC 40, FTSE 100, Euro Stoxx 50, Hang Seng, Shanghai Composite, Sensex, Nifty 50, KOSPI, gold, silver, WTI.

## Run

```bash
npm install
npm run pipeline    # scores → weights → backtest (no server)
npm run dev         # desk on http://127.0.0.1:43173
```

No API keys required for the research pipeline (lexicon scoring). Optional `NVIDIA_API_KEY` unlocks PM prose notes only. `LIVE_TRADING` is always false.

## Pipeline (what is real)

```
sample corpus (headlines, no stored scores)
        │
        ▼
   scorer  ── lexicon softmax (always) or FinBERT (optional)
        │
        ▼
    monthly S_t per asset + Yahoo-style metrics on the shipped tape
        │
        ▼
 constrained allocator (long-only, leverage 1, floor 1.2%, cap 20%, Σw = 1)
        │
        ▼
 walk-forward: weights from month t applied to returns of t+1
```

Constraints live in `lib/constraints.ts`. Rebalance is month-end with a one-month decision lag. The equity path on the desk is that backtest, not a hardcoded series.

Live Google News scrape is **optional and off**. `lib/scrape.ts` refuses `LIVE_SCRAPE=1` unless you wire an adapter. QA uses the sample corpus.

## Enable FinBERT

**Default (offline):** a documented lightweight equivalent — financial lexicon logits → 3-class softmax → the same \(S = P_+ - P_-\) identity. This is what `npm run pipeline` and the desk use when no model is present.

**Hugging Face Inference API** (ProsusAI/finbert):

```bash
cp .env.example .env.local
# set HF_TOKEN=hf_...
```

Restart the dev server. `POST /api/sentiment` will call FinBERT and fall back to the lexicon on any error.

**Local ONNX (Xenova/finbert, a port of ProsusAI/finbert):**

```bash
npm install -D @huggingface/transformers
npm run score:finbert
```

That writes `data/finbert-cache.json`. The dump is gitignored; the lexicon path stays the reproducible default.

## Optional PM notes (NVIDIA NIM)

Scoring stays **FinBERT-local dump or lexicon**. OpenAI and Anthropic are not used.

Hosted NIM is OpenAI-compatible at `https://integrate.api.nvidia.com/v1` ([LLM APIs](https://docs.api.nvidia.com/nim/reference/llm-apis)). Get a key at [build.nvidia.com/settings](https://build.nvidia.com/settings).

| Env | Role |
| --- | --- |
| `NVIDIA_API_KEY` | Optional. Unset → deterministic mock PM note. Badge **MOCK**. |
| Model | Locked to `google/gemma-4-31b-it` (env overrides ignored). |
| Base URL | Locked to `https://integrate.api.nvidia.com/v1`. |
| `LLM_PROVIDER=mock` | Force mock even if a key is set. |
| `LIVE_TRADING` | Always **false** — no broker. |

NIM calls use `stream: true` and a **180s** timeout. Cold start can take ~2 minutes; non-stream requests may hang. `/api/pm-note` and `/api/pipeline?pm=1` set `maxDuration = 180`. Failures fall back to mock prose; badge **FALLBACK MOCK**.

```bash
cp .env.example .env.local
# NVIDIA_API_KEY=nvapi-…
```

Desk masthead shows `backend` (lexicon / finbert-local / finbert-hf) and LLM badge. `GET /api/health` returns the same.

## What is stubbed

| Piece | Status |
| --- | --- |
| Scoring headlines into `{positive, negative, neutral}` | **Real** (lexicon always; FinBERT optional) |
| Monthly \(S_t\) from the scored corpus | **Real** |
| Constrained weights + month-end rebalance + lag | **Real** |
| Walk-forward equity curve + CAGR / Sharpe / MDD / Calmar | **Real**, on the shipped 2024–25 tape |
| Sample corpus (editorial + research prints) | **Real input**, in-repo |
| ProsusAI/finbert weights | **Stub unless enabled** (see above) |
| SB3 PPO/SAC/DDPG/TD3 and PyTorch meta-agents | **Stub** — inspectable mixers with those labels, not trained policies |
| Google News scrape | **Stub** — sample corpus is the driver |
| Yahoo Finance 2003–2024 | **Stub** — seeded sample tape, not the paper’s yfinance dump |
| HARLF 26% CAGR / Sharpe 1.2 (2018–24) | **Not claimed** |
| PM notes | **Mock without key**; optional NIM `google/gemma-4-31b-it` |

`GET /api/pipeline` returns the same report as `npm run pipeline`.

## Desk

FT/Economist wire: Libre Franklin + Source Serif 4, `#FAF7F2`, teal `#0F766E` only for the primary positive chip and positive scores. Masthead is **SENTIMENT BOOK**.

| Control | What it does |
| --- | --- |
| Edition date | Month for the wire, weights, YTD, and chart window |
| Source / name / tone chips | Filter the editorial wire. Scores are display-only |
| Headline | News shock: names the ticker/sleeve and the move in bp |
| Score a print | Offline lexicon — not live FinBERT |
| Model / Next edition | Base Case / Sentiment / Market / Equal; step one month |
| Equity path | Walk-forward NAV; click a month to open that edition |
| PM note | Optional mock or NVIDIA NIM prose (scoring unchanged) |

Headless: `npm run qa` with the dev server already up.

## Layout

```
lib/news.ts            Editorial headlines (no scores)
lib/corpus.ts          Full sample corpus + scoring
lib/sentiment.ts       Lexicon + optional FinBERT
lib/aggregate.ts       Monthly S_t
lib/constraints.ts     Floor / cap / long-only / lag
lib/allocator.ts       Three-tier HARLF-style mixer
lib/market.ts          Seeded monthly tape (returns independent of scorer)
lib/backtest.ts        Walk-forward mark-to-market
lib/pipeline.ts        End-to-end report
lib/pm-note.ts         Optional NVIDIA NIM / mock PM prose
lib/flags.ts           LIVE_TRADING=false + NIM lock
lib/scrape.ts          Optional live scrape hook (off)
app/api/sentiment      Score a headline
app/api/pipeline       JSON pipeline report (+ optional ?pm=1)
app/api/pm-note        PM note (mock or NIM)
app/api/health         Backend + LLM badges
```

## Licence

Code in this repository. Paper, FinBERT, and third-party marks remain with their authors. Past performance is not indicative of future results.
