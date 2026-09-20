"use client";

import { ASSET_BY_ID, ASSETS } from "@/lib/assets";
import { labelForScore, lexiconScore, signedScore } from "@/lib/sentiment";
import { signedChip } from "@/lib/format";
import { NEWS } from "@/lib/news";
import type { FinbertScores, NewsArticle } from "@/lib/types";
import { useMemo, useState } from "react";

const CLOCKS = [
  "08:41 ET",
  "08:17 ET",
  "07:52 ET",
  "07:31 ET",
  "07:08 ET",
  "06:44 ET",
  "06:19 ET",
  "06:02 ET",
];

const TONES = [
  { id: "ALL", label: "All" },
  { id: "pos", label: "Positive" },
  { id: "neu", label: "Neutral" },
  { id: "neg", label: "Negative" },
] as const;

type ToneId = (typeof TONES)[number]["id"];

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

  const sources = useMemo(
    () => Array.from(new Set(NEWS.map((n) => n.source))).sort(),
    []
  );

  const rows = useMemo(() => {
    const pool = NEWS.filter((n) => n.month <= month)
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
  }, [month, source, tone, name, sleeveIds]);

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
    setLiveNote(`offline-lexicon: ${signedChip(signedScore(scores))}`);
  }

  return (
    <aside className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#D6D0C6] pb-2">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-[#111827] uppercase">
          News wire
        </p>
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#6B7280]">
          <label className="flex items-center gap-1">
            <span className="text-[#C9C2B6]">|</span>
            <select
              aria-label="Filter by source"
              className="cursor-pointer bg-transparent pr-1 text-[12px] text-[#4B5563] outline-none"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              <option value="ALL">All Sources</option>
              {sources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1">
            <span className="text-[#C9C2B6]">|</span>
            <select
              aria-label="Filter by name"
              className="cursor-pointer bg-transparent pr-1 text-[12px] text-[#4B5563] outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
            >
              <option value="ALL">All names</option>
              {ASSETS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id}
                </option>
              ))}
            </select>
          </label>
        </div>
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
              className={`rounded-full border px-2.5 py-[2px] text-[11px] tabular ${
                on
                  ? "border-[#0F766E] text-[#0F766E]"
                  : "border-[#D6D0C6] text-[#6B7280]"
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
            className="ml-1 text-[11px] tracking-wide text-[#0F766E] uppercase"
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
              className="mt-2 block text-[11px] tracking-wide text-[#0F766E] uppercase"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </li>
        ) : (
          rows.map((article, i) => (
            <WireItem
              key={article.id}
              article={article}
              clock={CLOCKS[i] ?? "06:00 ET"}
              active={selectedId === article.id}
              onShock={() =>
                onSelect(selectedId === article.id ? null : article.id)
              }
              onChip={() => setTone(labelForScore(signedScore(article.scores)))}
            />
          ))
        )}
      </ul>

      <div className="mt-auto border-t border-[#E7E1D6] pt-3">
        <p className="tabular text-[12px] text-[#6B7280]">
          09:24 ET
          <span className="mx-2 text-[#C9C2B6]">|</span>
          {rows.length} stories
          <span className="mx-2 text-[#C9C2B6]">|</span>
          Sentiment aggregate:{" "}
          <span className={aggregate >= 0 ? "text-[#0F766E]" : "text-[#9A3412]"}>
            {signedChip(aggregate)} {aggregate >= 0 ? "↗" : "↘"}
          </span>
        </p>
        <button
          type="button"
          className="mt-2 text-[11px] tracking-wide text-[#0F766E] uppercase"
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
                    {a.id}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="text-[11px] tracking-wide text-[#0F766E] uppercase"
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

function WireItem({
  article,
  clock,
  active,
  onShock,
  onChip,
}: {
  article: NewsArticle;
  clock: string;
  active: boolean;
  onShock: () => void;
  onChip: () => void;
}) {
  const signed = signedScore(article.scores);
  const lab = labelForScore(signed);
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
          <button
            type="button"
            aria-label={`Filter ${lab} sentiment`}
            onClick={onChip}
            className={`tabular rounded-full border px-2 py-[1px] text-[11px] leading-5 ${
              lab === "pos"
                ? "border-[#0F766E] text-[#0F766E]"
                : lab === "neg"
                  ? "border-[#B45309] text-[#9A3412]"
                  : "border-[#C9C2B6] text-[#6B7280]"
            }`}
          >
            {signedChip(signed)}
          </button>
          <span className="tabular text-[11px] text-[#9CA3AF]">{clock}</span>
        </div>
      </div>
      <button type="button" onClick={onShock} className="mt-1 w-full text-left">
        <p className="text-[13px] leading-5 text-[#6B7280]">{article.dek}</p>
        <p className="mt-1 text-[12px] text-[#9A9186]">
          {article.source} • {asset?.desk ?? "Markets"} • {asset?.region}
        </p>
      </button>
    </li>
  );
}
