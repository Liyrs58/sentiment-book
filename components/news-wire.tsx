"use client";

import { ASSET_BY_ID, ASSETS, deskName, nameWithTicker } from "@/lib/assets";
import { labelForScore, lexiconScore, signedScore } from "@/lib/sentiment";
import { clampWords, editionCloseStamp, scoreClass, shortDate, signedChip } from "@/lib/format";
import { getDeskWire } from "@/lib/corpus";
import type { FinbertScores, NewsArticle } from "@/lib/types";
import { useMemo, useState } from "react";

const TONES = [
  { id: "ALL", label: "All" },
  { id: "pos", label: "Positive" },
  { id: "neu", label: "Neutral" },
  { id: "neg", label: "Negative" },
] as const;

type ToneId = (typeof TONES)[number]["id"];

/** Synthetic sample sources exposed by the offline desk wire. */
const SYNTHETIC_SOURCES = [
  "Demo Financial Wire",
  "Synthetic Research Feed",
  "Simulated Market News",
] as const;

export function NewsWire({
  month,
  selectedId,
  onSelect,
  onLiveShock,
  sleeveIds,
  sleeveLabel,
  onClearSleeve,
}: {
  month: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onLiveShock: (payload: {
    ticker: string;
    scores: FinbertScores;
    headline: string;
  }) => void;
  sleeveIds: string[] | null;
  sleeveLabel: string | null;
  onClearSleeve: () => void;
}) {
  const [source, setSource] = useState("ALL");
  const [tone, setTone] = useState<ToneId>("ALL");
  const [name, setName] = useState("ALL");
  const [headline, setHeadline] = useState("");
  const [liveTicker, setLiveTicker] = useState("GSPC");
  const [liveNote, setLiveNote] = useState<string | null>(null);
  const [compose, setCompose] = useState(false);

  const wire = useMemo(() => getDeskWire(), []);
  const sources = useMemo(
    () => Array.from(new Set(wire.map((n) => n.source))).sort(),
    [wire]
  );
  const moreSources = sources.filter(
    (s) => !(SYNTHETIC_SOURCES as readonly string[]).includes(s)
  );
  const moreSelected = moreSources.includes(source);

  const rows = useMemo(() => {
    const pool = wire.filter((n) => n.month <= month)
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((a) => {
        if (source !== "ALL" && a.source !== source) return false;
        if (name !== "ALL" && a.ticker !== name) return false;
        if (sleeveIds && !sleeveIds.includes(a.ticker)) return false;
        const lab = labelForScore(signedScore(a.scores));
        if (tone !== "ALL" && lab !== tone) return false;
        return true;
      });
    return pool.slice(0, 8);
  }, [wire, month, source, tone, name, sleeveIds]);

  const filtersOn =
    source !== "ALL" || tone !== "ALL" || name !== "ALL" || Boolean(sleeveIds);

  const aggregate =
    rows.reduce((n, a) => n + signedScore(a.scores), 0) /
    Math.max(rows.length, 1);

  function clearFilters() {
    setSource("ALL");
    setTone("ALL");
    setName("ALL");
    onClearSleeve();
  }

  function scoreLive() {
    const text = headline.trim();
    const scores = lexiconScore(text);
    onLiveShock({
      ticker: liveTicker,
      scores,
      headline: text,
    });
    setLiveNote(`S ${signedChip(signedScore(scores))}`);
  }

  return (
    <aside className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#D6D0C6] pb-2">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-[#111827] uppercase">
          News wire
        </p>
        <label className="text-[12px] text-[#6B7280]">
          <span className="sr-only">Filter by name</span>
          <select
            aria-label="Filter by name"
            className="max-w-[14rem] cursor-pointer bg-transparent text-right text-[12px] text-[#4B5563] outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
          >
            <option value="ALL">All names</option>
            {ASSETS.map((a) => (
              <option key={a.id} value={a.id}>
                {nameWithTicker(a)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-2 text-[11px] leading-4 text-[#6B7280]">
        Tone filters the wire · Headline applies shock.
      </p>
      <p className="mt-1 text-[11px] leading-4 text-[#9A9186]">
        Score = mean(P₊−P₋), [−1,+1]
      </p>

      <div className="mt-2 flex flex-wrap items-center text-[11px] tracking-wide uppercase">
        <SourceChip
          label="All"
          pressed={source === "ALL"}
          ariaLabel="Filter source All"
          onClick={() => setSource("ALL")}
        />
        {SYNTHETIC_SOURCES.map((s) => (
          <span key={s} className="flex items-center">
            <span className="mx-2 text-[#C9C2B6]" aria-hidden>
              |
            </span>
            <SourceChip
              label={s}
              pressed={source === s}
              ariaLabel={`Filter source ${s}`}
              onClick={() => setSource(s)}
            />
          </span>
        ))}
        <span className="mx-2 text-[#C9C2B6]" aria-hidden>
          |
        </span>
        <label className="flex items-baseline gap-1 text-[11px] text-[#6B7280]">
          <span className={moreSelected ? "border-b border-[#111827] text-[#111827]" : ""}>
            More
          </span>
          <select
            aria-label="Filter by source"
            className="cursor-pointer bg-transparent text-[11px] text-[#4B5563] outline-none"
            value={moreSelected ? source : ""}
            onChange={(e) => setSource(e.target.value || "ALL")}
          >
            <option value="">—</option>
            {moreSources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {TONES.map((item) => {
          const on = tone === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={on}
              aria-label={`Filter ${item.label} sentiment`}
              onClick={() => setTone(item.id)}
              className={`border px-1.5 py-px text-[10px] tracking-[0.12em] uppercase ${
                on && item.id === "pos"
                  ? "border-[#0F766E] text-[#0F766E]"
                  : on && item.id === "neg"
                    ? "border-[#9A3412] text-[#9A3412]"
                    : on
                      ? "border-[#111827] text-[#111827]"
                      : "border-[#C9C2B6] text-[#6B7280]"
              }`}
            >
              {item.label}
            </button>
          );
        })}
        {filtersOn ? (
          <button
            type="button"
            onClick={clearFilters}
            className="ml-1 text-[11px] tracking-wide text-[#111827] uppercase"
          >
            Clear filters
            {sleeveLabel ? ` · ${sleeveLabel}` : ""}
          </button>
        ) : null}
      </div>

      <ul className="mt-1 flex-1">
        {rows.length === 0 ? (
          <li className="py-8 text-sm text-[#6B7280]">
            No prints match those filters.
            <button
              type="button"
              className="mt-2 block text-[11px] tracking-wide text-[#111827] uppercase"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </li>
        ) : (
          rows.map((article) => (
            <WireItem
              key={article.id}
              article={article}
              active={selectedId === article.id}
              onShock={() =>
                onSelect(selectedId === article.id ? null : article.id)
              }
            />
          ))
        )}
      </ul>

      <div className="mt-auto border-t border-[#E7E1D6] pt-3">
        <p className="text-[12px] text-[#6B7280]">
          {editionCloseStamp(month)}
          <span className="mx-2 text-[#C9C2B6]">|</span>
          {rows.length} stories
          <span className="mx-2 text-[#C9C2B6]">|</span>
          Sentiment aggregate:{" "}
          <span className={`score ${scoreClass(aggregate)}`}>
            {signedChip(aggregate)}
          </span>
        </p>
        <button
          type="button"
          className="mt-2 text-[11px] tracking-wide text-[#111827] uppercase"
          onClick={() => setCompose((v) => !v)}
        >
          {compose ? "Hide live score" : "Score a print"}
        </button>
        {compose ? (
          <form
            className="mt-2"
            onSubmit={(e) => {
              e.preventDefault();
              scoreLive();
            }}
          >
            <input
              required
              minLength={8}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Headline to score"
              aria-label="Headline to score"
              className="w-full border-b border-[#C9C2B6] bg-transparent py-1 text-sm outline-none"
            />
            <div className="mt-2 flex items-center gap-2">
              <select
                aria-label="Live score ticker"
                className="bg-transparent text-xs text-[#4B5563] outline-none"
                value={liveTicker}
                onChange={(e) => setLiveTicker(e.target.value)}
              >
                {ASSETS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {nameWithTicker(a)}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="text-[11px] tracking-wide text-[#111827] uppercase"
              >
                Apply shock
              </button>
            </div>
            {liveNote ? (
              <p className="mt-1 text-[12px] text-[#6B7280]">{liveNote}</p>
            ) : null}
          </form>
        ) : null}
      </div>
    </aside>
  );
}

function SourceChip({
  label,
  pressed,
  ariaLabel,
  onClick,
}: {
  label: string;
  pressed: boolean;
  ariaLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`border-b pb-px text-[11px] tracking-wide uppercase ${
        pressed
          ? "border-[#111827] text-[#111827]"
          : "border-transparent text-[#6B7280]"
      }`}
    >
      {label}
    </button>
  );
}

function WireItem({
  article,
  active,
  onShock,
}: {
  article: NewsArticle;
  active: boolean;
  onShock: () => void;
}) {
  const signed = signedScore(article.scores);
  const asset = ASSET_BY_ID[article.ticker];
  return (
    <li
      className={`border-b border-[#EDE8DF] py-3.5 last:border-b-0 ${active ? "bg-[#F3EEE6]" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={onShock} className="min-w-0 flex-1 text-left">
          <h3 className="font-serif text-[1.15rem] leading-[1.35] text-[#111827] sm:text-[1.22rem]">
            {article.headline}
          </h3>
        </button>
        <div className="mt-0.5 flex shrink-0 items-center gap-2">
          <span data-score className={`score text-[11px] leading-5 ${scoreClass(signed)}`}>
            {signedChip(signed)}
          </span>
          <span className="score text-[11px] text-[#9CA3AF]">
            {shortDate(article.date)}
          </span>
        </div>
      </div>
      <button type="button" onClick={onShock} className="mt-1 w-full text-left">
        <p className="dek-clamp text-[13px] leading-5 text-[#6B7280]">
          {clampWords(article.dek)}
        </p>
        <p className="mt-1 text-[12px] text-[#9A9186]">
          {article.source} • {deskName(asset, article.ticker)} • {asset?.region}
        </p>
      </button>
    </li>
  );
}
