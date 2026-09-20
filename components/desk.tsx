"use client";

import { useMemo, useState } from "react";
import { NewsWire } from "@/components/news-wire";
import { AllocationList } from "@/components/portfolio-board";
import { EquityPath, windowCurve, ytdReturn } from "@/components/charts";
import { allocate, tiltRisk } from "@/lib/allocator";
import { ASSET_BY_ID, SAMPLE_MONTHS, deskName } from "@/lib/assets";
import { runBacktest } from "@/lib/backtest";
import { SLEEVES } from "@/lib/sleeves";
import { editionCloseStamp, editionDate, pct, signedChip } from "@/lib/format";
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
  const [showBench, setShowBench] = useState(true);
  const [note, setNote] = useState<string | null>(null);

  const snapshot = useMemo(
    () =>
      allocate({
        month,
        shockArticleId: liveShock ? null : shockId,
        liveShock,
      }),
    [month, shockId, liveShock]
  );
  const baseline = useMemo(() => allocate({ month }), [month]);

  const backtest = useMemo(() => runBacktest(month), [month]);
  const path = useMemo(
    () => windowCurve(backtest.curve, month),
    [backtest.curve, month]
  );
  const ytd = useMemo(
    () => ytdReturn(backtest.curve, month),
    [backtest.curve, month]
  );

  const raw = useMemo(() => pickModel(snapshot, model), [snapshot, model]);
  const weights = useMemo(() => tiltRisk(raw, risk), [raw, risk]);
  const prior = snapshot.shock
    ? tiltRisk(pickModel(baseline, model), risk)
    : null;

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
      setNote(
        `Book marked at ${editionDate(month)} with the current model and risk profile. No later edition.`
      );
      return;
    }
    const next = SAMPLE_MONTHS[idx + 1];
    setMonth(next);
    setShockId(null);
    setLiveShock(null);
    setNote(`Rebalanced. Next mark is ${editionDate(next)}. Shock cleared.`);
  }

  return (
    <div className="min-h-full bg-[#FAF7F2] text-[#111827]">
      <div className="mx-auto max-w-[1180px] px-5 py-6 sm:px-8 sm:py-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <section>
            <header className="mb-6">
              <h1 className="font-serif text-[2.55rem] leading-[0.95] font-semibold tracking-[-0.02em] text-[#111827] uppercase sm:text-[3.15rem]">
                SENTIMENT&nbsp;BOOK
              </h1>
              <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-[#111827] uppercase">
                  News · Sentiment · Portfolio construction
                </p>
                <label className="text-[13px] text-[#6B7280]">
                  <span className="sr-only">Edition</span>
                  <select
                    aria-label="Edition date"
                    className="cursor-pointer bg-transparent text-right text-[13px] text-[#6B7280] outline-none"
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
                setNote(id ? "News shock applied to the NLP sleeve." : null);
              }}
              onLiveShock={(payload) => {
                setShockId(null);
                setLiveShock(payload);
                setNote("Live lexicon score applied as a shock.");
              }}
            />
          </section>

          <section className="lg:border-l lg:border-[#D6D0C6] lg:pl-10">
            <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-[#D6D0C6] pb-3">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-[#111827] uppercase">
                Portfolio construction
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#6B7280]">
                <label className="flex items-center gap-1">
                  Model:
                  <select
                    aria-label="Allocation model"
                    className="cursor-pointer bg-transparent text-[#111827] outline-none"
                    value={model}
                    onChange={(e) => setModel(e.target.value as ModelKey)}
                  >
                    <option value="super">Base Case</option>
                    <option value="nlp">NLP meta</option>
                    <option value="market">Data meta</option>
                    <option value="equal">Equal weight</option>
                  </select>
                </label>
                <button
                  type="button"
                  aria-label="Rebalance book"
                  onClick={rebalance}
                  className="border border-[#111827] px-2 py-0.5 text-[11px] tracking-[0.12em] text-[#111827] uppercase"
                >
                  Rebalance
                </button>
                <span>{editionCloseStamp(month)}</span>
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

            {note ? (
              <p className="mt-3 text-[12px] leading-4 text-[#6B7280]">{note}</p>
            ) : null}

            <div className="mt-8 border-t border-[#D6D0C6] pt-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-[#111827] uppercase">
                  Equity allocation: total return
                </p>
                <p className="text-[13px] text-[#6B7280]">
                  YTD Performance{" "}
                  <span
                    className={`tabular ${ytd >= 0 ? "text-[#0F766E]" : "text-[#9A3412]"}`}
                  >
                    {pct(ytd, 2)} {ytd >= 0 ? "\u2197" : "\u2198"}
                  </span>
                </p>
              </div>
              <EquityPath
                data={path}
                showModel={showModel}
                showBench={showBench}
                onSelectMonth={changeMonth}
              />
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
                <button
                  type="button"
                  aria-pressed={showBench}
                  onClick={() => setShowBench((v) => !v)}
                  className={showBench ? "text-[#6B7280]" : "text-[#C9C2B6] line-through"}
                >
                  <span className="mr-2 inline-block w-5 border-t border-dashed border-current align-middle" />
                  Equal-weight book
                </button>
              </p>
              <p className="mt-2 text-[11px] leading-4 text-[#9A9186]">
                Illustrative seeded path — not a live backtest / not HARLF reported returns.
              </p>
            </div>
          </section>
        </div>

        <footer className="mt-8 flex flex-wrap items-end justify-between gap-3 border-t border-[#111827] pt-3 text-[11px] tracking-[0.08em] text-[#9A9186] uppercase">
          <p>Data sources: Sample wire · FinBERT-paper · Seeded HARLF tape</p>
          <p className="normal-case tracking-normal">
            All times ET · Past performance is not indicative of future results.
          </p>
        </footer>
      </div>
    </div>
  );
}

function whyTheseWeights(
  snapshot: {
    shock?: { ticker: string; headline: string; signedDelta: number };
    alpha: number;
    regime: string;
  },
  model: ModelKey,
  risk: RiskProfile,
  weights: WeightMap,
  prior: WeightMap | null
): string {
  if (snapshot.shock) {
    const asset = ASSET_BY_ID[snapshot.shock.ticker];
    const name = deskName(asset, snapshot.shock.ticker);
    const signed = snapshot.shock.signedDelta;
    const dir = signed >= 0 ? "lifts" : "cuts";
    const tilt = prior
      ? (weights[snapshot.shock.ticker] ?? 0) - (prior[snapshot.shock.ticker] ?? 0)
      : 0;
    const tiltTxt =
      prior && Math.abs(tilt) >= 0.002
        ? ` Sleeve weight ${tilt >= 0 ? "up" : "down"} ${pct(tilt, 1)}.`
        : "";
    return `Selected print ${dir} ${name} in the NLP sleeve (S ${signedChip(signed)}).${tiltTxt} Mixer stays long-only, 20% cap.`;
  }
  const modelLabel =
    model === "equal"
      ? "Equal-weight book"
      : model === "nlp"
        ? "NLP meta-agent"
        : model === "market"
          ? "Data meta-agent"
          : "Base-case mixer";
  const riskLine =
    risk === "offensive"
      ? "offensive equity tilt"
      : risk === "defensive"
        ? "defensive gold/commodity tilt"
        : "balanced risk";
  return `${modelLabel} on a ${snapshot.regime.replace("-", " ")} tape; ${riskLine}. NLP mix α ${(snapshot.alpha * 100).toFixed(0)}%.`;
}

function pickModel(snapshot: { superWeights: WeightMap; equalWeights: WeightMap; agents: { id: string; weights: WeightMap }[] }, model: ModelKey): WeightMap {
  if (model === "equal") return snapshot.equalWeights;
  if (model === "nlp") {
    return snapshot.agents.find((a) => a.id === "meta-nlp")?.weights ?? snapshot.superWeights;
  }
  if (model === "market") {
    return snapshot.agents.find((a) => a.id === "meta-mkt")?.weights ?? snapshot.superWeights;
  }
  return snapshot.superWeights;
}
