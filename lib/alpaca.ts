import { allocate } from "./allocator";
import { ASSET_BY_ID, deskName } from "./assets";
import { assertBook } from "./constraints";
import {
  ALPACA_PAPER_BASE_URL,
  LIVE_TRADING,
  alpacaBaseUrl,
  alpacaConfigured,
  paperBroker,
} from "./flags";
import { persistPipelineCache } from "./pipeline-cache";
import { runResearchPipeline } from "./pipeline";
import type { WeightMap } from "./types";

/** Liquid ETFs that stand in for the HARLF index/commodity book on Alpaca paper. */
export const PAPER_SYMBOLS: Record<string, string> = {
  GSPC: "SPY",
  IXIC: "QQQ",
  DJI: "DIA",
  FCHI: "EWQ",
  FTSE: "EWU",
  SX5E: "FEZ",
  HSI: "EWH",
  SSEC: "MCHI",
  BSESN: "INDA",
  NSEI: "NFTY",
  KS11: "EWY",
  GC: "GLD",
  SI: "SLV",
  CL: "USO",
};

export type PaperProposed = {
  id: string;
  name: string;
  symbol: string;
  weight: number;
  notional: number;
};

export type PaperAccount = {
  equity: number;
  cash: number;
  status: string;
  paper: true;
};

export type PaperReadResult = {
  ok: boolean;
  liveTrading: false;
  enabled: boolean;
  configured: boolean;
  broker: "off" | "alpaca";
  baseUrl: string;
  month: string;
  account: PaperAccount | null;
  positions: { symbol: string; qty: string; market_value: string }[];
  proposed: PaperProposed[];
  error?: string;
  note: string;
};

export type PaperSubmitResult = PaperReadResult & {
  submitted: { symbol: string; notional: number; id?: string }[];
  closed: string[];
};

function paperNote(): string {
  return "Optional paper sleeve. LIVE_TRADING=false. Read account or submit only when you click.";
}

function constrainedWeights(month: string): WeightMap {
  return assertBook(allocate({ month }).superWeights);
}

function proposedFromEquity(month: string, equity: number): PaperProposed[] {
  const weights = constrainedWeights(month);
  return Object.entries(PAPER_SYMBOLS).map(([id, symbol]) => {
    const weight = weights[id] ?? 0;
    const notional = Math.floor(equity * weight * 100) / 100;
    return {
      id,
      name: deskName(ASSET_BY_ID[id], id),
      symbol,
      weight,
      notional,
    };
  });
}

async function alpacaFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (LIVE_TRADING) {
    throw new Error("LIVE_TRADING is hard-false; refusing broker call.");
  }
  const base = alpacaBaseUrl();
  if (base !== ALPACA_PAPER_BASE_URL || !base.startsWith("https://paper-api.alpaca.markets")) {
    throw new Error("Alpaca base is locked to paper-api.alpaca.markets.");
  }
  const key = process.env.ALPACA_API_KEY?.trim();
  const secret = process.env.ALPACA_API_SECRET?.trim();
  if (!key || !secret) throw new Error("Alpaca paper keys missing.");
  return fetch(`${base}${path}`, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(15_000),
    headers: {
      "APCA-API-KEY-ID": key,
      "APCA-API-SECRET-KEY": secret,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

async function readAccount(): Promise<PaperAccount> {
  const res = await alpacaFetch("/v2/account");
  if (!res.ok) throw new Error(`Alpaca account ${res.status}`);
  const body = (await res.json()) as {
    equity?: string;
    cash?: string;
    status?: string;
  };
  return {
    equity: Number(body.equity ?? 0),
    cash: Number(body.cash ?? 0),
    status: String(body.status ?? "unknown"),
    paper: true,
  };
}

async function readPositions(): Promise<{ symbol: string; qty: string; market_value: string }[]> {
  const res = await alpacaFetch("/v2/positions");
  if (!res.ok) throw new Error(`Alpaca positions ${res.status}`);
  const body = (await res.json()) as Array<{
    symbol?: string;
    qty?: string;
    market_value?: string;
  }>;
  if (!Array.isArray(body)) return [];
  return body.map((row) => ({
    symbol: String(row.symbol ?? ""),
    qty: String(row.qty ?? "0"),
    market_value: String(row.market_value ?? "0"),
  }));
}

export async function readPaperSleeve(month = "2025-05"): Promise<PaperReadResult> {
  const broker = paperBroker();
  const base: PaperReadResult = {
    ok: true,
    liveTrading: false,
    enabled: broker === "alpaca",
    configured: alpacaConfigured(),
    broker,
    baseUrl: ALPACA_PAPER_BASE_URL,
    month,
    account: null,
    positions: [],
    proposed: proposedFromEquity(month, 100_000),
    note: paperNote(),
  };

  if (broker !== "alpaca") {
    return { ...base, proposed: [], note: "PAPER_BROKER=off. HARLF research does not need a broker." };
  }
  if (!alpacaConfigured()) {
    return {
      ...base,
      ok: false,
      error: "ALPACA_API_KEY and ALPACA_API_SECRET are required for the paper sleeve.",
    };
  }

  try {
    const account = await readAccount();
    const positions = await readPositions();
    return {
      ...base,
      account,
      positions,
      proposed: proposedFromEquity(month, account.equity > 0 ? account.equity : 100_000),
    };
  } catch (error) {
    return {
      ...base,
      ok: false,
      error: error instanceof Error ? error.message : "Alpaca paper read failed.",
    };
  }
}

export async function submitPaperSleeve(opts: {
  month?: string;
  confirm?: boolean;
}): Promise<PaperSubmitResult> {
  const month = opts.month ?? "2025-05";
  const read = await readPaperSleeve(month);
  const empty: PaperSubmitResult = { ...read, submitted: [], closed: [] };

  if (LIVE_TRADING) {
    return { ...empty, ok: false, error: "LIVE_TRADING is hard-false." };
  }
  if (opts.confirm !== true) {
    return { ...empty, ok: false, error: "Submit requires an explicit confirm click." };
  }
  if (read.broker !== "alpaca") {
    return { ...empty, ok: false, error: "PAPER_BROKER is off." };
  }
  if (!read.configured || !read.ok || !read.account) {
    return { ...empty, ok: false, error: read.error ?? "Paper account unavailable." };
  }

  const sleeveSymbols = new Set(Object.values(PAPER_SYMBOLS));
  const closed: string[] = [];
  const submitted: { symbol: string; notional: number; id?: string }[] = [];

  try {
    const openOrders = await alpacaFetch("/v2/orders?status=open&limit=100");
    if (openOrders.ok) {
      const orders = (await openOrders.json()) as Array<{ id?: string; symbol?: string }>;
      for (const order of orders) {
        if (!order.id || !sleeveSymbols.has(String(order.symbol))) continue;
        await alpacaFetch(`/v2/orders/${order.id}`, { method: "DELETE" });
      }
    }

    for (const position of read.positions) {
      if (!sleeveSymbols.has(position.symbol)) continue;
      const close = await alpacaFetch(`/v2/positions/${encodeURIComponent(position.symbol)}`, {
        method: "DELETE",
      });
      if (close.ok || close.status === 404) closed.push(position.symbol);
    }

    for (const row of read.proposed) {
      if (row.notional < 1) continue;
      const order = await alpacaFetch("/v2/orders", {
        method: "POST",
        body: JSON.stringify({
          symbol: row.symbol,
          notional: row.notional.toFixed(2),
          side: "buy",
          type: "market",
          time_in_force: "day",
        }),
      });
      if (!order.ok) {
        const detail = await order.text();
        throw new Error(`Alpaca order ${row.symbol} ${order.status}: ${detail.slice(0, 180)}`);
      }
      const body = (await order.json()) as { id?: string };
      submitted.push({ symbol: row.symbol, notional: row.notional, id: body.id });
    }

    await persistPipelineCache(runResearchPipeline(month), {
      month,
      paperSubmittedAt: new Date().toISOString(),
    });

    return {
      ...read,
      ok: true,
      submitted,
      closed,
      note: `Submitted ${submitted.length} notional paper buys. LIVE_TRADING=false.`,
    };
  } catch (error) {
    return {
      ...empty,
      submitted,
      closed,
      ok: false,
      error: error instanceof Error ? error.message : "Alpaca paper submit failed.",
    };
  }
}
