import { NextResponse } from "next/server";
import { runResearchPipeline } from "@/lib/pipeline";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const month = url.searchParams.get("month") ?? "2025-05";
  const report = runResearchPipeline(month);
  return NextResponse.json(report);
}
