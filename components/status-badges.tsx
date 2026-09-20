"use client";

import { useEffect, useState } from "react";

export function StatusBadges({ month }: { month: string }) {
  const [backendBadge, setBackendBadge] = useState("lexicon");
  const [llmBadge, setLlmBadge] = useState("MOCK");
  const [paperBadge, setPaperBadge] = useState("PAPER=off");
  const [pmNote, setPmNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (typeof j?.backend === "string") setBackendBadge(j.backend);
        if (typeof j?.llm?.badge === "string") setLlmBadge(j.llm.badge);
        if (typeof j?.paper?.broker === "string") {
          setPaperBadge(`PAPER=${j.paper.broker}`);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function loadPmNote() {
    setPmNote("…");
    fetch(`/api/pm-note?month=${encodeURIComponent(month)}`)
      .then((r) => r.json())
      .then((j) => {
        if (typeof j?.llm?.badge === "string") setLlmBadge(j.llm.badge);
        if (typeof j?.backend === "string") setBackendBadge(j.backend);
        setPmNote(typeof j?.pmNote === "string" ? j.pmNote : "No note.");
      })
      .catch(() => setPmNote("PM note unavailable."));
  }

  return (
    <div className="mt-2 space-y-2">
      <p className="flex flex-wrap gap-2 text-[10px] font-semibold tracking-[0.12em] uppercase text-[#6B7280]">
        <span data-qa="badge-backend" className="rounded border border-[#D6D0C6] px-1.5 py-0.5">
          {backendBadge}
        </span>
        <span data-qa="badge-llm" className="rounded border border-[#D6D0C6] px-1.5 py-0.5">
          {llmBadge}
        </span>
        <span data-qa="badge-live" className="rounded border border-[#D6D0C6] px-1.5 py-0.5">
          LIVE_TRADING=false
        </span>
        <span data-qa="badge-paper" className="rounded border border-[#D6D0C6] px-1.5 py-0.5">
          {paperBadge}
        </span>
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          data-qa="pm-note"
          onClick={loadPmNote}
          className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#0F766E] underline-offset-2 hover:underline"
        >
          PM note
        </button>
        {pmNote ? (
          <p className="max-w-prose text-[12px] leading-4 text-[#6B7280]">{pmNote}</p>
        ) : null}
      </div>
    </div>
  );
}
