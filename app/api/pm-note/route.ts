import { NextResponse } from "next/server";
import { unauthorizedIfGated } from "@/lib/auth";
import { LIVE_TRADING } from "@/lib/flags";
import { runResearchPipeline } from "@/lib/pipeline";
import { generatePmNote } from "@/lib/pm-note";

export const maxDuration = 180;

export async function GET(request: Request) {
  const gated = unauthorizedIfGated(request);
  if (gated) return gated;
  const url = new URL(request.url);
  const month = url.searchParams.get("month") ?? "2025-05";
  const report = runResearchPipeline(month);
  const pm = await generatePmNote(report);
  return NextResponse.json({
    liveTrading: LIVE_TRADING,
    backend: report.backend,
    backendNote: report.backendNote,
    articlesScored: report.articlesScored,
    month: report.month,
    pmNote: pm.note,
    llm: {
      provider: pm.provider,
      model: pm.model,
      badge: pm.badge,
    },
  });
}
