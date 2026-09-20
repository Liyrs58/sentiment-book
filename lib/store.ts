import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { blobConfigured } from "./flags";
import type { FinbertScores, ScorerBackend } from "./types";

export type StoreBackend = "blob" | "committed" | "tmp";

export type StoreInfo = {
  durable: boolean;
  backend: StoreBackend;
};

export type DeskSession = {
  month: string;
  updatedAt: string;
  paperSubmittedAt?: string;
};

export type PipelineCacheFile = {
  version: 1;
  kind: "pipeline-cache";
  savedAt: string;
  backend: ScorerBackend;
  backendNote: string;
  articlesScored: number;
  month: string;
  weights: { id: string; name: string; weight: number }[];
  sampleScores: {
    id: string;
    headline: string;
    scores: FinbertScores;
    signed: number;
  }[];
  backtest: {
    rule: string;
    months: number;
    harlf: { cagr: number; sharpe: number; maxDrawdown: number; calmar: number };
    equal: { cagr: number; sharpe: number; maxDrawdown: number; calmar: number };
    spx: { cagr: number; sharpe: number; maxDrawdown: number; calmar: number };
  };
  session: DeskSession;
};

export const COMMITTED_CACHE_PATH = join(process.cwd(), "data", "pipeline-cache.json");
export const TMP_CACHE_PATH = join("/tmp", "sentiment-book-pipeline-cache.json");
export const BLOB_CACHE_PATH = "sentiment-book/pipeline-cache.json";

export function storeInfo(): StoreInfo {
  if (blobConfigured()) return { durable: true, backend: "blob" };
  if (existsSync(COMMITTED_CACHE_PATH)) return { durable: true, backend: "committed" };
  return { durable: false, backend: "tmp" };
}

function parseCache(raw: string): PipelineCacheFile | null {
  try {
    const parsed = JSON.parse(raw) as PipelineCacheFile;
    if (parsed?.version !== 1 || parsed.kind !== "pipeline-cache") return null;
    if (!parsed.session?.month || !Array.isArray(parsed.weights)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function readFileJson(path: string): PipelineCacheFile | null {
  try {
    if (!existsSync(path)) return null;
    return parseCache(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function writeFileQuiet(path: string, body: string): boolean {
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, body);
    return true;
  } catch {
    return false;
  }
}

async function readBlobCache(): Promise<PipelineCacheFile | null> {
  if (!blobConfigured()) return null;
  try {
    const { get } = await import("@vercel/blob");
    const result = await get(BLOB_CACHE_PATH, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    const text = await new Response(result.stream).text();
    return parseCache(text);
  } catch {
    return null;
  }
}

async function writeBlobCache(body: string): Promise<boolean> {
  if (!blobConfigured()) return false;
  try {
    const { put } = await import("@vercel/blob");
    await put(BLOB_CACHE_PATH, body, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return true;
  } catch {
    return false;
  }
}

export async function readPipelineCache(): Promise<PipelineCacheFile | null> {
  const fromBlob = await readBlobCache();
  if (fromBlob) return fromBlob;
  return readFileJson(COMMITTED_CACHE_PATH) ?? readFileJson(TMP_CACHE_PATH);
}

export async function writePipelineCache(
  data: PipelineCacheFile
): Promise<StoreInfo> {
  const body = `${JSON.stringify(data, null, 2)}\n`;
  if (await writeBlobCache(body)) {
    writeFileQuiet(TMP_CACHE_PATH, body);
    return { durable: true, backend: "blob" };
  }
  if (writeFileQuiet(COMMITTED_CACHE_PATH, body)) {
    writeFileQuiet(TMP_CACHE_PATH, body);
    return { durable: true, backend: "committed" };
  }
  writeFileQuiet(TMP_CACHE_PATH, body);
  return storeInfo();
}
