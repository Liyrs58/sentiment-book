/**
 * Research-desk flags. LIVE_TRADING is always false — no broker path.
 * NVIDIA NIM is optional and only used for portfolio-manager prose notes.
 * Scoring stays FinBERT-local dump or lexicon (never OpenAI/Anthropic).
 */
export const LIVE_TRADING = false;
export const NVIDIA_MODEL = "google/gemma-4-31b-it";
export const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
/** NIM cold start is ~2 min. Non-stream can hang — always stream. */
export const NVIDIA_TIMEOUT_MS = 180_000;

export function isLiveTrading(): boolean {
  return false;
}

export function nvidiaBaseUrl(): string {
  return NVIDIA_BASE_URL;
}

export function nvidiaModel(): string {
  return NVIDIA_MODEL;
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
