/**
 * Research-desk flags. LIVE_TRADING is always false — no live broker path.
 * Optional PAPER_BROKER=alpaca is a paper sleeve only (paper-api.alpaca.markets).
 * NVIDIA NIM is optional and only used for portfolio-manager prose notes.
 * Scoring stays FinBERT-local dump or lexicon (never OpenAI/Anthropic).
 */
export const LIVE_TRADING = false;
export const NVIDIA_MODEL = "google/gemma-4-31b-it";
export const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
/** NIM cold start is ~2 min. Non-stream can hang — always stream. */
export const NVIDIA_TIMEOUT_MS = 180_000;
/** Paper trading only. Live api.alpaca.markets is never used. */
export const ALPACA_PAPER_BASE_URL = "https://paper-api.alpaca.markets";
export const GATE_COOKIE = "sb_gate";
export const GATE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function isLiveTrading(): boolean {
  return false;
}

export function nvidiaBaseUrl(): string {
  return NVIDIA_BASE_URL;
}

export function nvidiaModel(): string {
  return NVIDIA_MODEL;
}

export type PaperBroker = "off" | "alpaca";

/** Default off. HARLF research does not require a broker. */
export function paperBroker(): PaperBroker {
  const value = process.env.PAPER_BROKER?.trim().toLowerCase();
  return value === "alpaca" ? "alpaca" : "off";
}

export function alpacaBaseUrl(): string {
  return ALPACA_PAPER_BASE_URL;
}

export function alpacaConfigured(): boolean {
  return Boolean(
    process.env.ALPACA_API_KEY?.trim() && process.env.ALPACA_API_SECRET?.trim()
  );
}

/** Gate is on only when DEMO_ACCESS_CODE is set. Unset = public desk. */
export function isAuthRequired(): boolean {
  return Boolean(process.env.DEMO_ACCESS_CODE?.trim());
}

export function authSecret(): string {
  return (
    process.env.AUTH_SECRET?.trim() ||
    process.env.DEMO_ACCESS_CODE?.trim() ||
    ""
  );
}

export function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export type LlmProvider = "mock" | "nvidia";

export function detectLlmProvider(): LlmProvider {
  const forced = process.env.LLM_PROVIDER?.toLowerCase();
  if (forced === "mock") return "mock";
  const key = process.env.NVIDIA_API_KEY?.trim();
  if (!key) return "mock";
  if (!forced || forced === "auto" || forced === "nvidia" || forced === "nim") {
    return "nvidia";
  }
  return "mock";
}
