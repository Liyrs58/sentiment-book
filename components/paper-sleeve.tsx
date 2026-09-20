"use client";

import { useEffect, useState } from "react";

type PaperState = {
  ok: boolean;
  enabled: boolean;
  configured: boolean;
  broker: "off" | "alpaca";
  account: { equity: number; cash: number; status: string } | null;
  proposed: { id: string; name: string; symbol: string; weight: number; notional: number }[];
  submitted?: { symbol: string; notional: number }[];
  error?: string;
  note?: string;
};

export function PaperSleeve({ month }: { month: string }) {
  const [enabled, setEnabled] = useState(false);
  const [state, setState] = useState<PaperState | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j?.paper?.broker === "alpaca") setEnabled(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function readAccount() {
    setBusy(true);
    setConfirm(false);
    try {
      const res = await fetch(`/api/paper?month=${encodeURIComponent(month)}`);
      const json = (await res.json()) as PaperState;
      setState(json);
    } catch {
      setState({
        ok: false,
        enabled: true,
        configured: false,
        broker: "alpaca",
        account: null,
        proposed: [],
        error: "Paper account unread.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function submitSleeve() {
    if (!confirm) {
      setConfirm(true);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, confirm: true }),
      });
      const json = (await res.json()) as PaperState;
      setState(json);
      setConfirm(false);
    } catch {
      setState((prev) => ({
        ok: false,
        enabled: true,
        configured: prev?.configured ?? false,
        broker: "alpaca",
        account: prev?.account ?? null,
        proposed: prev?.proposed ?? [],
        error: "Paper submit failed.",
      }));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;

  return (
    <div className="mt-8 border-t border-[#D6D0C6] pt-4">
      <p className="text-[11px] font-semibold tracking-[0.14em] text-[#111827] uppercase">
        Paper sleeve
      </p>
      <p className="mt-1 text-[12px] leading-4 text-[#6B7280]">
        Optional Alpaca paper. Mirrors constrained weights as ETF notionals. Nothing is sent until
        you click. LIVE_TRADING=false.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          data-qa="paper-read"
          disabled={busy}
          onClick={readAccount}
          className="border border-[#111827] px-2 py-0.5 text-[11px] tracking-[0.12em] uppercase disabled:opacity-40"
        >
          Read paper account
        </button>
        <button
          type="button"
          data-qa="paper-submit"
          disabled={busy}
          onClick={submitSleeve}
          className="border border-[#D6D0C6] px-2 py-0.5 text-[11px] tracking-[0.12em] uppercase disabled:opacity-40"
        >
          {confirm ? "Click to confirm paper orders" : "Submit sleeve to paper"}
        </button>
      </div>
      {state?.account ? (
        <p className="mt-2 score text-[12px] text-[#6B7280]">
          Equity {state.account.equity.toFixed(0)} · cash {state.account.cash.toFixed(0)} ·{" "}
          {state.account.status}
        </p>
      ) : null}
      {state?.proposed?.length ? (
        <ul className="mt-2 grid grid-cols-2 gap-x-4 text-[11px] text-[#6B7280] sm:grid-cols-3">
          {state.proposed.slice(0, 6).map((row) => (
            <li key={row.id}>
              {row.symbol} {(row.weight * 100).toFixed(1)}% · {row.notional.toFixed(0)}
            </li>
          ))}
        </ul>
      ) : null}
      {state?.submitted?.length ? (
        <p className="mt-2 text-[12px] text-[#0F766E]">
          Submitted {state.submitted.length} paper orders.
        </p>
      ) : null}
      {state?.error ? <p className="mt-2 text-[12px] text-[#9A3412]">{state.error}</p> : null}
      {state?.note && !state.error ? (
        <p className="mt-2 text-[11px] text-[#9A9186]">{state.note}</p>
      ) : null}
    </div>
  );
}
