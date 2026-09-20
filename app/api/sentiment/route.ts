import { NextResponse } from "next/server";
import { lexiconScore } from "@/lib/sentiment";

type HfLabel = { label: string; score: number };

function fromHf(payload: unknown) {
  const row = Array.isArray(payload)
    ? Array.isArray(payload[0])
      ? (payload[0] as HfLabel[])
      : (payload as HfLabel[])
    : null;
  if (!row?.length) return null;
  const map: Record<string, number> = { positive: 0, negative: 0, neutral: 0 };
  for (const item of row) {
    const key = item.label.toLowerCase();
    if (key in map) map[key] = item.score;
  }
  const sum = map.positive + map.negative + map.neutral;
  if (sum <= 0) return null;
  return {
    positive: map.positive / sum,
    negative: map.negative / sum,
    neutral: map.neutral / sum,
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as { text?: string };
  const text = (body.text ?? "").trim();
  if (text.length < 8) {
    return NextResponse.json(
      { error: "Headline too short to score." },
      { status: 400 }
    );
  }

  const token = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
  if (!token) {
    return NextResponse.json({
      source: "lexicon",
      model: "offline-lexicon",
      scores: lexiconScore(text),
      note: "No HF_TOKEN. Using the bundled lexicon. Set HF_TOKEN to call ProsusAI/finbert.",
    });
  }

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/ProsusAI/finbert",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text }),
      }
    );
    if (!response.ok) {
      return NextResponse.json({
        source: "lexicon",
        model: "offline-lexicon",
        scores: lexiconScore(text),
        note: `Hugging Face returned ${response.status}. Fell back to lexicon.`,
      });
    }
    const payload: unknown = await response.json();
    const scores = fromHf(payload);
    if (!scores) {
      return NextResponse.json({
        source: "lexicon",
        model: "offline-lexicon",
        scores: lexiconScore(text),
        note: "Unexpected FinBERT payload. Fell back to lexicon.",
      });
    }
    return NextResponse.json({
      source: "finbert",
      model: "ProsusAI/finbert",
      scores,
    });
  } catch {
    return NextResponse.json({
      source: "lexicon",
      model: "offline-lexicon",
      scores: lexiconScore(text),
      note: "Network error. Fell back to lexicon.",
    });
  }
}
