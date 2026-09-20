/**
 * Guards for the free-tier upgrades: LIVE_TRADING hard-false, optional gate,
 * durable store, paper sleeve default-off and paper-api only.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  accessCodeMatches,
  hasValidGateCookie,
  issueGateToken,
  verifyGateToken,
} from "../lib/auth";
import { submitPaperSleeve } from "../lib/alpaca";
import {
  ALPACA_PAPER_BASE_URL,
  LIVE_TRADING,
  alpacaBaseUrl,
  blobConfigured,
  isAuthRequired,
  isLiveTrading,
  nvidiaModel,
  paperBroker,
} from "../lib/flags";
import { healthPayload } from "../lib/health";
import { persistPipelineCache } from "../lib/pipeline-cache";
import { runResearchPipeline } from "../lib/pipeline";
import { COMMITTED_CACHE_PATH, storeInfo } from "../lib/store";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) {
    console.error(`FAIL  ${message}`);
    process.exit(1);
  }
  console.log(`PASS  ${message}`);
}

const report = runResearchPipeline("2025-05");
const store = await persistPipelineCache(report, { month: report.month });
const health = healthPayload();

assert(LIVE_TRADING === false, "LIVE_TRADING const is false");
assert(isLiveTrading() === false, "isLiveTrading() is false");
assert(health.liveTrading === false, "health.liveTrading is false");
assert(typeof health.store.durable === "boolean", "health.store.durable present");
assert(health.store.durable === true, "committed/blob store is durable");
assert(health.store.backend === "committed" || health.store.backend === "blob", "store backend is durable");
assert(health.auth.required === false, "auth.required false when DEMO_ACCESS_CODE unset");
assert(health.paper.broker === "off", "paper broker default off");
assert(health.paper.configured === false, "paper keys unset");
assert(health.paper.baseUrl === "https://paper-api.alpaca.markets", "paper base URL locked");
assert(alpacaBaseUrl() === ALPACA_PAPER_BASE_URL, "alpacaBaseUrl locked");
assert(alpacaBaseUrl() !== "https://api.alpaca.markets", "live Alpaca URL unused");
assert(paperBroker() === "off", "PAPER_BROKER default off");
assert(nvidiaModel() === "google/gemma-4-31b-it", "NIM model locked");
assert(!blobConfigured(), "blob token unset in this check");
assert(store.durable === true, "pipeline persist is durable");
assert(store.backend === "committed", "CLI persist wrote committed cache");

const cache = JSON.parse(readFileSync(COMMITTED_CACHE_PATH, "utf8")) as {
  kind?: string;
  articlesScored?: number;
  session?: { month?: string };
};
assert(cache.kind === "pipeline-cache", "committed cache kind");
assert((cache.articlesScored ?? 0) >= 50, "committed cache scored corpus");
assert(cache.session?.month === "2025-05", "session month persisted");

process.env.DEMO_ACCESS_CODE = "desk-test";
process.env.AUTH_SECRET = "unit-secret";
assert(isAuthRequired() === true, "auth.required when DEMO_ACCESS_CODE set");
assert(accessCodeMatches("desk-test"), "access code matches");
assert(!accessCodeMatches("nope"), "wrong code rejected");
const token = issueGateToken();
assert(verifyGateToken(token), "signed cookie verifies");
assert(hasValidGateCookie(`${"sb_gate"}=${token}`), "cookie header authenticates");
assert(!verifyGateToken("v1.1.deadbeef"), "tampered cookie rejected");
delete process.env.DEMO_ACCESS_CODE;
delete process.env.AUTH_SECRET;
assert(isAuthRequired() === false, "auth returns to public");

const refused = await submitPaperSleeve({ confirm: true, month: "2025-05" });
assert(refused.ok === false, "paper submit refused when broker off");
assert(refused.liveTrading === false, "paper result liveTrading false");
assert(refused.broker === "off", "paper submit broker off");

const unconfirmed = await submitPaperSleeve({ confirm: false, month: "2025-05" });
assert(unconfirmed.ok === false, "paper submit requires confirm");

const alpacaSrc = readFileSync(join(process.cwd(), "lib", "alpaca.ts"), "utf8");
assert(alpacaSrc.includes("https://paper-api.alpaca.markets"), "paper host in alpaca module");
assert(!alpacaSrc.includes("https://api.alpaca.markets"), "live Alpaca host absent");
const flagsSrc = readFileSync(join(process.cwd(), "lib", "flags.ts"), "utf8");
assert(flagsSrc.includes("export const LIVE_TRADING = false"), "LIVE_TRADING hard-coded");

assert(storeInfo().durable === true, "storeInfo durable after cache write");
assert(health.backend === "lexicon" || health.backend === "finbert-local", "scoring stays free path");

console.log("\nfree-tier checks passed");
