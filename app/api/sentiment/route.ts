import { NextResponse } from "next/server";
import { unauthorizedIfGated } from "@/lib/auth";
import { hydrateFinbertCache } from "@/lib/finbert-cache";
import { scoreHeadline } from "@/lib/sentiment";

export async function POST(request: Request) {
  const gated = unauthorizedIfGated(request);
  if (gated) return gated;
  const body = (await request.json()) as { text?: string };
  const text = (body.text ?? "").trim();
  if (text.length < 8) {
    return NextResponse.json(
      { error: "Headline too short to score." },
      { status: 400 }
    );
  }
  hydrateFinbertCache();
  const result = await scoreHeadline(text);
  return NextResponse.json({
    source: result.backend,
    model:
      result.backend === "finbert-hf"
        ? "ProsusAI/finbert"
        : result.backend === "finbert-local"
          ? "cached-finbert"
          : "offline-lexicon",
    scores: result.scores,
    note: result.note,
  });
}
