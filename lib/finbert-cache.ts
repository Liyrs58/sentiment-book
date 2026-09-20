import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadFinbertDump } from "./sentiment";
import type { FinbertScores } from "./types";

/**
 * Node-only. Loads `data/finbert-cache.json` if present (from
 * `npm run score:finbert`). Missing file is the documented mock path:
 * lexicon softmax with the same S = P+ − P− identity.
 *
 * Do not import this from client components.
 */
let hydrated = false;
let loaded = false;

export function hydrateFinbertCache(): boolean {
  if (hydrated) return loaded;
  hydrated = true;
  try {
    const path = join(process.cwd(), "data", "finbert-cache.json");
    if (!existsSync(path)) return false;
    const dump = JSON.parse(readFileSync(path, "utf8")) as {
      items?: { text: string; scores: FinbertScores }[];
    };
    const items = dump.items;
    if (!Array.isArray(items) || items.length === 0) return false;
    loadFinbertDump(
      items.filter(
        (row) =>
          row &&
          typeof row.text === "string" &&
          row.scores &&
          typeof row.scores.positive === "number"
      )
    );
    loaded = true;
    return true;
  } catch {
    return false;
  }
}
