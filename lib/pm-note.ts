import {
  detectLlmProvider,
  nvidiaBaseUrl,
  nvidiaModel,
  NVIDIA_TIMEOUT_MS,
  type LlmProvider,
} from "./flags";
import type { PipelineReport } from "./types";

export type LlmBadge =
  | "MOCK"
  | "NVIDIA/google/gemma-4-31b-it"
  | "FALLBACK MOCK";

export type PmNoteResult = {
  note: string;
  provider: LlmProvider | "fallback";
  badge: LlmBadge;
  model: string;
};

function mockPmNote(report: PipelineReport): string {
  const top = [...report.weights]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((w) => `${w.name} ${(w.weight * 100).toFixed(1)}%`)
    .join("; ");
  const cagr = (report.backtest.harlf.cagr * 100).toFixed(1);
  const sharpe = report.backtest.harlf.sharpe.toFixed(2);
  return (
    `PM note (${report.month}, ${report.backend}): book tilts ${top}. ` +
    `Walk-forward CAGR ${cagr}% / Sharpe ${sharpe} on the simulated sample tape; these are demo outputs, not empirical evidence of predictive alpha. ` +
    `Scoring is ${report.backendNote} LIVE_TRADING=false.`
  );
}

function deltaContent(chunk: unknown): string {
  if (!chunk || typeof chunk !== "object") return "";
  const choices = (chunk as { choices?: Array<Record<string, unknown>> }).choices;
  const first = choices?.[0];
  if (!first) return "";
  const delta = first.delta as { content?: unknown } | undefined;
  if (typeof delta?.content === "string") return delta.content;
  const message = first.message as { content?: unknown } | undefined;
  if (typeof message?.content === "string") return message.content;
  return "";
}

function parseSse(buffer: string): string {
  let out = "";
  for (const raw of buffer.split("\n")) {
    const line = raw.trim();
    if (!line.startsWith("data:")) continue;
    const data = line.slice(5).trim();
    if (!data || data === "[DONE]") continue;
    try {
      out += deltaContent(JSON.parse(data));
    } catch {
      /* skip torn JSON */
    }
  }
  return out;
}

async function readNvidiaBody(res: Response): Promise<string> {
  if (!res.body) throw new Error("NVIDIA stream missing body");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let raw = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    raw += decoder.decode(value, { stream: true });
  }
  raw += decoder.decode();
  const trimmed = raw.trim();
  if (trimmed.startsWith("data:") || trimmed.includes("\ndata:")) {
    return parseSse(raw);
  }
  try {
    return deltaContent(JSON.parse(trimmed));
  } catch {
    return trimmed;
  }
}

async function callNvidia(system: string, user: string): Promise<string> {
  const key = process.env.NVIDIA_API_KEY?.trim();
  if (!key) throw new Error("NVIDIA_API_KEY missing");
  const res = await fetch(`${nvidiaBaseUrl()}/chat/completions`, {
    method: "POST",
    signal: AbortSignal.timeout(NVIDIA_TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: nvidiaModel(),
      temperature: 0.2,
      max_tokens: 600,
      stream: true,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`NVIDIA ${res.status}`);
  const text = await readNvidiaBody(res);
  if (!text.trim()) throw new Error("NVIDIA empty stream");
  return text.trim();
}

const SYSTEM = `You are a portfolio manager writing a short research note for a sentiment desk.
Return plain prose only (2–4 sentences). No markdown, no bullets, no JSON.
Do not invent returns beyond the numbers given. Do not claim live trading.
Mention the scoring backend name if provided. Use a concise financial research tone.`;

/**
 * Optional PM prose. This only rewrites a note; it does not score headlines.
 * Unset NVIDIA_API_KEY → deterministic mock. Failures → FALLBACK MOCK.
 */
export async function generatePmNote(
  report: PipelineReport
): Promise<PmNoteResult> {
  const model = nvidiaModel();
  const provider = detectLlmProvider();
  const fallback = mockPmNote(report);

  if (provider === "mock") {
    return { note: fallback, provider: "mock", badge: "MOCK", model };
  }

  try {
    const top = [...report.weights]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5)
      .map((w) => `${w.name}=${(w.weight * 100).toFixed(1)}%`)
      .join(", ");
    const user = JSON.stringify({
      month: report.month,
      backend: report.backend,
      backendNote: report.backendNote,
      articlesScored: report.articlesScored,
      topWeights: top,
      harlf: {
        cagr: report.backtest.harlf.cagr,
        sharpe: report.backtest.harlf.sharpe,
        maxDrawdown: report.backtest.harlf.maxDrawdown,
      },
      liveTrading: false,
    });
    const note = await callNvidia(SYSTEM, user);
    return {
      note,
      provider: "nvidia",
      badge: "NVIDIA/google/gemma-4-31b-it",
      model,
    };
  } catch {
    return {
      note: fallback,
      provider: "fallback",
      badge: "FALLBACK MOCK",
      model,
    };
  }
}
