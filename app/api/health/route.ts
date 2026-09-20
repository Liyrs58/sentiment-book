import { NextResponse } from "next/server";
import { LIVE_TRADING, detectLlmProvider, nvidiaModel } from "@/lib/flags";
import { hydrateFinbertCache } from "@/lib/finbert-cache";
import { activeBackend } from "@/lib/sentiment";

export async function GET() {
  hydrateFinbertCache();
  const { backend, note } = activeBackend();
  const llm = detectLlmProvider();
  return NextResponse.json({
    ok: true,
    liveTrading: LIVE_TRADING,
    backend,
    backendNote: note,
    llm: {
      provider: llm,
      model: nvidiaModel(),
      badge: llm === "nvidia" ? "NVIDIA/google/gemma-4-31b-it" : "MOCK",
    },
  });
}
