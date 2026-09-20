import { NextResponse } from "next/server";
import { unauthorizedIfGated } from "@/lib/auth";
import { LIVE_TRADING, detectLlmProvider, nvidiaModel } from "@/lib/flags";
import { persistPipelineCache } from "@/lib/pipeline-cache";
import { runResearchPipeline } from "@/lib/pipeline";
import { generatePmNote } from "@/lib/pm-note";
import { storeInfo } from "@/lib/store";

export const maxDuration = 180;

export async function GET(request: Request) {
  const gated = unauthorizedIfGated(request);
  if (gated) return gated;
  const url = new URL(request.url);
  const month = url.searchParams.get("month") ?? "2025-05";
  const withPm = url.searchParams.get("pm") === "1";
  const report = runResearchPipeline(month);
  let store = storeInfo();
  try {
    store = await persistPipelineCache(report, { month });
  } catch {
    /* committed /tmp / blob best-effort */
  }
  const llmProvider = detectLlmProvider();

  if (!withPm) {
    return NextResponse.json({
      ...report,
      liveTrading: LIVE_TRADING,
      store,
      llm: {
        provider: llmProvider,
        model: nvidiaModel(),
        badge: llmProvider === "nvidia" ? "NVIDIA/google/gemma-4-31b-it" : "MOCK",
      },
    });
  }

  const pm = await generatePmNote(report);
  return NextResponse.json({
    ...report,
    liveTrading: LIVE_TRADING,
    store,
    pmNote: pm.note,
    llm: {
      provider: pm.provider,
      model: pm.model,
      badge: pm.badge,
    },
  });
}
