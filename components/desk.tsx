"use client";

import { useMemo, useState } from "react";
import { StatusBadges } from "@/components/status-badges";
import { PaperSleeve } from "@/components/paper-sleeve";
import { NewsWire } from "@/components/news-wire";
import { AllocationList } from "@/components/portfolio-board";
import { EquityPath, windowCurve, ytdReturn } from "@/components/charts";
import { allocate, tiltRisk } from "@/lib/allocator";
import { ASSET_BY_ID, SAMPLE_MONTHS, deskName } from "@/lib/assets";
import { runBacktest } from "@/lib/backtest";
import { SLEEVES } from "@/lib/sleeves";
import { editionCloseStamp, editionDate, formatBp, pct, signedChip } from "@/lib/format";
import type { FinbertScores, RiskProfile, WeightMap } from "@/lib/types";

type ModelKey = "super" | "equal" | "nlp" | "market";

export function Desk() {
  const [month, setMonth] = useState("2025-05");
  const [shockId, setShockId] = useState<string | null>(null);
  const [liveShock, setLiveShock] = useState<{
    ticker: string;
    scores: FinbertScores;
    headline: string;
  } | null>(null);
  const [model, setModel] = useState<ModelKey>("super");
  const [risk, setRisk] = useState<RiskProfile>("balanced");
  const [sleeveId, setSleeveId] = useState<string | null>(null);
  const [showModel, setShowModel] = useState(true);
  const [note, setNote] = useState<string | null>(null);

  const snapshot = useMemo(
    () => allocate({ month, shockArticleId: liveShock ? null : shockId, liveShock }),
    [month, shockId, liveShock]
  );
  const baseline = useMemo(() => allocate({ month }), [month]);
  const backtest = useMemo(() => runBacktest(month), [month]);
  const path = useMemo(() => windowCurve(backtest.curve, month), [backtest.curve, month]);
  const ytd = useMemo(() => ytdReturn(backtest.curve, month), [backtest.curve, month]);
  const raw = useMemo(() => pickModel(snapshot, model), [snapshot, model]);
  const weights = useMemo(() => tiltRisk(raw, risk), [raw, risk]);
  const prior = snapshot.shock ? tiltRisk(pickModel(baseline, model), risk) : null;
  const sleeve = SLEEVES.find((s) => s.id === sleeveId) ?? null;
  const idx = SAMPLE_MONTHS.indexOf(month as (typeof SAMPLE_MONTHS)[number]);

  function changeMonth(next: string) {
    setMonth(next);
    setShockId(null);
    setLiveShock(null);
    setNote(null);
  }

  function rebalance() {
    if (idx < 0) return;
    if (idx >= SAMPLE_MONTHS.length - 1) {
      setNote(`Book marked at ${editionDate(month)}. No later edition.`);
      return;
    }
    const next = SAMPLE_MONTHS[idx + 1];
    setMonth(next);
    setShockId(null);
    setLiveShock(null);
    setNote(`Opened next edition · ${editionDate(next)}.`);
  }

  return (
    <div className="min-h-full bg-[#FAF7F2] text-[#111827]">
      <div className="mx-auto max-w-[1180px] px-5 py-6 sm:px-8 sm:py-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <section>
            <header className="mb-6">
              <h1 className="font-serif text-[2.15rem] leading-[0.95] font-semibold tracking-[-0.02em] text-[#111827] uppercase sm:text-[3.15rem]">
                SENTIMENT&nbsp;BOOK
              </h1>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-[#111827] uppercase">
                  News · Sentiment · Portfolio construction
                </p>
                <StatusBadges month={month} />
                <label className="min-w-0 text-[13px] text-[#6B7280]">
                  <span className="sr-only">Edition</span>
                  <select
                    aria-label="Edition date"
                    className="max-w-full cursor-pointer bg-transparent text-left text-[13px] text-[#6B7280] outline-none sm:text-right"
                    value={month}
                    onChange={(e) => changeMonth(e.target.value)}
                  >
                    {SAMPLE_MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {editionDate(m)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </header>
            <NewsWire
              month={month}
              selectedId={liveShock ? "live-desk" : shockId}
              sleeveIds={sleeve?.ids ?? null}
              sleeveLabel={sleeve?.label ?? null}
              onClearSleeve={() => setSleeveId(null)}
              onSelect={(id) => {
                setLiveShock(null);
                setShockId(id);
                setNote(null);
              }}
              onLiveShock={(payload) => {
                setShockId(null);
                setLiveShock(payload);
                setNote(null);
              }}
            />
          </section>

          <section className="lg:border-l lg:border-[#D6D0C6] lg:pl-10">
            <header className="mb-6 border-b border-[#D6D0C6] pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-[#111827] uppercase">
                  Portfolio construction
                </p>
                <div className="flex min-w-0 flex-col items-start gap-1 sm:items-end">
                  <label className="flex items-center gap-1 text-[12px] text-[#6B7280]">
                    Model:
                    <select
                      aria-label="Allocation model"
                      className="cursor-pointer bg-transparent text-[#111827] outline-none"
                      value={model}
                      onChange={(e) => setModel(e.target.value as ModelKey)}
                    >
                      <option value="super">Base Case</option>
                      <option value="nlp">Sentiment</option>
                      <option value="market">Market</option>
                      <option value="equal">Equal</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    aria-label="Next edition"
                    onClick={rebalance}
                    className="mt-1 border border-[#111827] px-2 py-0.5 text-[11px] tracking-[0.12em] text-[#111827] uppercase"
                  >
                    Next edition
                  </button>
                  <span className="text-[11px] text-[#6B7280]">{editionCloseStamp(month)}</span>
                </div>
              </div>
            </header>

            <AllocationList
              snapshot={snapshot}
              weights={weights}
              prior={prior}
              risk={risk}
              onRisk={setRisk}
              activeSleeve={sleeveId}
              onSleeve={(id) => setSleeveId(id)}
              onClearShock={() => {
                setShockId(null);
                setLiveShock(null);
                setNote(null);
              }}
              why={whyTheseWeights(snapshot, model, risk, weights, prior)}
            />

            {note ? <p className="mt-3 text-[12px] leading-4 text-[#6B7280]">{note}</p> : null}

            <PaperSleeve month={month} />

            <div className="mt-8 border-t border-[#D6D0C6] pt-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-[#111827] uppercase">
                  Equity allocation: total return
                </p>
                <p className="text-[13px] text-[#6B7280]">
                  YTD Performance{" "}
                  <span className={`score ${ytd >= 0 ? "text-[#0F766E]" : "text-[#9A3412]"}`}>
                    {pct(ytd, 2)}
                  </span>
                </p>
              </div>
              <EquityPath data={path} showModel={showModel} showBench onSelectMonth={changeMonth} />
              <p className="mt-1 text-[11px] leading-4 text-[#9A9186]">
                {path[0] ? `index = 100 at ${path[0].label}` : "index = 100 at the first month in view"}
              </p>
              <p className="mt-1 flex flex-wrap gap-4 text-[11px] text-[#6B7280]">
                <button
                  type="button"
                  aria-pressed={showModel}
                  onClick={() => setShowModel((v) => !v)}
                  className={showModel ? "text-[#111827]" : "text-[#C9C2B6] line-through"}
                >
                  <span className="mr-2 inline-block h-[2px] w-5 bg-current align-middle" />
                  Model Portfolio
                </button>
                <span className="text-[#6B7280]">
                  <span className="mr-2 inline-block w-5 border-t border-dashed border-current align-middle" />
                  Equal-weight book
                </span>
              </p>
            </div>
          </section>
        </div>

        <footer className="mt-8 border-t border-[#111827] pt-3 text-[11px] leading-4 text-[#9A9186]">
          <p>
            Synthetic sample headlines. Scoring: three-class financial lexicon baseline or optional FinBERT dump. Optional PM notes via NVIDIA NIM
            (mock without key). Walk-forward metrics use the simulated market tape and are not empirical evidence. Optional Alpaca paper sleeve is
            off by default. LIVE_TRADING=false.
          </p>
          <p className="mt-1">Past performance is not indicative of future results.</p>
        </footer>
      </div>
    </div>
  );
}

function whyTheseWeights(
  snapshot: { shock?: { ticker: string; signedDelta: number }; regime: string },
  model: ModelKey,
  risk: RiskProfile,
  weights: WeightMap,
  prior: WeightMap | null
): string {
  if (snapshot.shock) {
    const ticker = snapshot.shock.ticker;
    const name = deskName(ASSET_BY_ID[ticker], ticker);
    const signed = snapshot.shock.signedDelta;
    const verb = signed >= 0 ? "lifts" : "cuts";
    let move = "book held inside the 20% cap";
    if (prior) {
      move = `${ticker} ${formatBp((weights[ticker] ?? 0) - (prior[ticker] ?? 0))}`;
    }
    return `${name} print ${verb} ${move}. S ${signedChip(signed)}. Long-only, 20% cap.`;
  }
  const modelLabel =
    model === "equal" ? "Equal book" : model === "nlp" ? "Sentiment book" : model === "market" ? "Market book" : "Base-case mixer";
  const riskLine =
    risk === "offensive" ? "offensive equity tilt" : risk === "defensive" ? "defensive gold/commodity tilt" : "balanced risk";
  return `${modelLabel} on a ${snapshot.regime.replace("-", " ")} book; ${riskLine}.`;
}

function pickModel(
  snapshot: { superWeights: WeightMap; equalWeights: WeightMap; agents: { id: string; weights: WeightMap }[] },
  model: ModelKey
): WeightMap {
  if (model === "equal") return snapshot.equalWeights;
  if (model === "nlp") return snapshot.agents.find((a) => a.id === "meta-nlp")?.weights ?? snapshot.superWeights;
  if (model === "market") return snapshot.agents.find((a) => a.id === "meta-mkt")?.weights ?? snapshot.superWeights;
  return snapshot.superWeights;
}
