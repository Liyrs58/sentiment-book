import {
  ALPACA_PAPER_BASE_URL,
  LIVE_TRADING,
  alpacaConfigured,
  detectLlmProvider,
  isAuthRequired,
  nvidiaModel,
  paperBroker,
} from "@/lib/flags";
import { hydrateFinbertCache } from "@/lib/finbert-cache";
import { activeBackend } from "@/lib/sentiment";
import { storeInfo } from "@/lib/store";

export function healthPayload() {
  hydrateFinbertCache();
  const { backend, note } = activeBackend();
  const llm = detectLlmProvider();
  return {
    ok: true,
    liveTrading: LIVE_TRADING,
    backend,
    backendNote: note,
    llm: {
      provider: llm,
      model: nvidiaModel(),
      badge: llm === "nvidia" ? "NVIDIA/google/gemma-4-31b-it" : "MOCK",
    },
    store: storeInfo(),
    auth: { required: isAuthRequired() },
    paper: {
      broker: paperBroker(),
      configured: alpacaConfigured(),
      baseUrl: ALPACA_PAPER_BASE_URL,
    },
  };
}
