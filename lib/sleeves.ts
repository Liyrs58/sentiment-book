import { ASSETS, EQUAL_WEIGHT } from "./assets";
import type { WeightMap } from "./types";

export type SleeveTone = "teal" | "ink";

export type Sleeve = {
  id: string;
  label: string;
  ids: string[];
  tone: SleeveTone;
};

/** Nested presentation matching the mockup: parent sleeves + regional/commodity lines. */
export const SLEEVES: Sleeve[] = [
  {
    id: "equities",
    label: "Equities",
    ids: ASSETS.filter((a) => a.assetClass === "Equities").map((a) => a.id),
    tone: "teal",
  },
  {
    id: "us",
    label: "United States",
    ids: ["GSPC", "IXIC", "DJI"],
    tone: "teal",
  },
  {
    id: "europe",
    label: "Europe",
    ids: ["FCHI", "FTSE", "SX5E"],
    tone: "teal",
  },
  {
    id: "asia",
    label: "Asia",
    ids: ["HSI", "SSEC", "BSESN", "NSEI", "KS11"],
    tone: "teal",
  },
  {
    id: "commodities",
    label: "Commodities",
    ids: ["GC", "SI", "CL"],
    tone: "ink",
  },
  { id: "gold", label: "Gold", ids: ["GC"], tone: "teal" },
  { id: "silver", label: "Silver", ids: ["SI"], tone: "teal" },
  { id: "energy", label: "Energy", ids: ["CL"], tone: "teal" },
];

export type SleeveRow = {
  id: string;
  label: string;
  value: number;
  benchmark: number;
  delta: number | null;
  tone: SleeveTone;
};

function sumIds(weights: WeightMap, ids: string[]) {
  return ids.reduce((n, id) => n + (weights[id] ?? 0), 0);
}

export function sleeveRows(
  weights: WeightMap,
  prior?: WeightMap | null
): SleeveRow[] {
  return SLEEVES.map((sleeve) => {
    const value = sumIds(weights, sleeve.ids);
    const benchmark = sleeve.ids.length * EQUAL_WEIGHT;
    const delta = prior ? value - sumIds(prior, sleeve.ids) : null;
    return {
      id: sleeve.id,
      label: sleeve.label,
      value,
      benchmark,
      delta,
      tone: sleeve.tone,
    };
  });
}
