"use client";

import type { AllocationSnapshot, RiskProfile, WeightMap } from "@/lib/types";
import { SLEEVES, sleeveRows } from "@/lib/sleeves";
import { pct } from "@/lib/format";

export function AllocationList({
  snapshot,
  weights,
  prior,
  risk,
  onRisk,
  activeSleeve,
  onSleeve,
  onClearShock,
}: {
  snapshot: AllocationSnapshot;
  weights: WeightMap;
  prior: WeightMap | null;
  risk: RiskProfile;
  onRisk: (value: RiskProfile) => void;
  activeSleeve: string | null;
  onSleeve: (id: string | null, tickers: string[]) => void;
  onClearShock: () => void;
}) {
  const rows = sleeveRows(weights, prior);

  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-[#111827] uppercase">
          Model allocations
        </p>
        <label className="text-right text-[12px] text-[#6B7280]">
          Risk Profile:{" "}
          <select
            aria-label="Risk profile"
            className="cursor-pointer bg-transparent text-[#111827] outline-none"
            value={risk}
            onChange={(e) => onRisk(e.target.value as RiskProfile)}
          >
            <option value="balanced">Balanced</option>
            <option value="offensive">Offensive</option>
            <option value="defensive">Defensive</option>
          </select>
          <span className="mt-0.5 block tabular text-[#111827]">Total: 100%</span>
        </label>
      </div>

      {snapshot.shock ? (
        <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
          <p className="text-[12px] leading-4 text-[#6B7280]">
            Shock on {snapshot.shock.ticker}: {snapshot.shock.headline}
          </p>
          <button
            type="button"
            onClick={onClearShock}
            className="text-[11px] tracking-wide text-[#0F766E] uppercase"
          >
            Clear shock
          </button>
        </div>
      ) : null}

      <ul className="mt-3 min-w-0 space-y-2">
        {rows.map((row) => {
          const sleeve = SLEEVES.find((s) => s.id === row.id);
          const on = activeSleeve === row.id;
          return (
            <li key={row.id}>
              <button
                type="button"
                aria-pressed={on}
                aria-label={`Filter wire to ${row.label}`}
                onClick={() =>
                  onSleeve(on ? null : row.id, sleeve?.ids ?? [])
                }
                className={`grid w-full grid-cols-[minmax(5.5rem,7.5rem)_2.2rem_minmax(3rem,1fr)_auto] items-center gap-x-2 text-left text-[13px] ${
                  on ? "text-[#0F766E]" : "text-[#111827]"
                }`}
              >
                <span className="truncate">{row.label}</span>
                <span className="tabular text-right">
                  {Math.round(row.value * 100)}%
                </span>
                <span className="h-[11px]">
                  <span
                    className="block h-[11px]"
                    style={{
                      width: `${Math.min(100, row.value * 100)}%`,
                      background: row.tone === "ink" ? "#6B7280" : "#0F766E",
                    }}
                  />
                </span>
                <span className="tabular text-right text-[12px] text-[#9CA3AF]">
                  Benchmark {Math.round(row.benchmark * 100)}%
                  {row.delta !== null && Math.abs(row.delta) >= 0.002 ? (
                    <span
                      className={`ml-1 ${row.delta >= 0 ? "text-[#0F766E]" : "text-[#9A3412]"}`}
                    >
                      {pct(row.delta, 1)}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
