"use client";

import { useState } from "react";

export function GateForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Invalid access code.");
        return;
      }
      const next = new URLSearchParams(window.location.search).get("next") || "/";
      window.location.assign(next.startsWith("/") ? next : "/");
    } catch {
      setError("Could not reach the gate.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 max-w-sm space-y-3">
      <label className="block text-[12px] tracking-[0.12em] text-[#6B7280] uppercase">
        Access code
        <input
          type="password"
          autoComplete="current-password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="mt-1 block w-full border border-[#D6D0C6] bg-transparent px-3 py-2 text-[14px] text-[#111827] outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={pending || code.trim().length === 0}
        className="border border-[#111827] px-3 py-1.5 text-[11px] tracking-[0.14em] text-[#111827] uppercase disabled:opacity-40"
      >
        {pending ? "Checking" : "Enter desk"}
      </button>
      {error ? <p className="text-[12px] text-[#9A3412]">{error}</p> : null}
    </form>
  );
}
