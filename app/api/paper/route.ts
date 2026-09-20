import { NextResponse } from "next/server";
import { unauthorizedIfGated } from "@/lib/auth";
import { LIVE_TRADING } from "@/lib/flags";
import { readPaperSleeve, submitPaperSleeve } from "@/lib/alpaca";

export const maxDuration = 30;

export async function GET(request: Request) {
  const gated = unauthorizedIfGated(request);
  if (gated) return gated;
  const url = new URL(request.url);
  const month = url.searchParams.get("month") ?? "2025-05";
  const result = await readPaperSleeve(month);
  return NextResponse.json({ ...result, liveTrading: LIVE_TRADING });
}

export async function POST(request: Request) {
  const gated = unauthorizedIfGated(request);
  if (gated) return gated;
  const body = (await request.json().catch(() => ({}))) as {
    month?: string;
    confirm?: boolean;
  };
  const result = await submitPaperSleeve({
    month: body.month,
    confirm: body.confirm === true,
  });
  const status = result.ok ? 200 : result.broker === "off" || body.confirm !== true ? 400 : 502;
  return NextResponse.json({ ...result, liveTrading: LIVE_TRADING }, { status });
}
