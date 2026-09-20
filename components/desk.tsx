"use client";

import { useMemo, useState } from "react";
import { StatusBadges } from "@/components/status-badges";
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
    setNote(`Opened next edition · ${editionDate(next)}. Book marked; shock cleared.`);
  }

  return (
    <div className="min-h-full bg-[#FAF7F2] text-[#111827]">
      <div className="mx-auto max-w-[1180px] px-5 py-6 sm:px-8 sm:py-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <section>
