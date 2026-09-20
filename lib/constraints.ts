import { ASSET_IDS } from "./assets";
import type { PortfolioConstraints, WeightMap } from "./types";

/** HARLF-style book constraints (paper §4: long-only, no leverage, 20% cap). */
export const CONSTRAINTS: PortfolioConstraints = {
  longOnly: true,
  leverage: 1,
  minWeight: 0.012,
  maxWeight: 0.2,
  sumToOne: true,
  rebalance: "month-end",
  decisionLagMonths: 1,
};

export const MIN_W = CONSTRAINTS.minWeight;
export const MAX_W = CONSTRAINTS.maxWeight;

/** Project onto the simplex with floor/cap via iterative surplus redistribution. */
export function project(raw: WeightMap): WeightMap {
  const ids = ASSET_IDS;
  let w = Object.fromEntries(
    ids.map((id) => [id, Math.min(MAX_W, Math.max(MIN_W, raw[id] ?? MIN_W))])
  );
  for (let k = 0; k < 8; k += 1) {
    const sum = ids.reduce((a, id) => a + w[id], 0);
    w = Object.fromEntries(ids.map((id) => [id, w[id] / sum]));
    let overflow = 0;
    for (const id of ids) {
      if (w[id] > MAX_W) {
        overflow += w[id] - MAX_W;
        w[id] = MAX_W;
      }
      if (w[id] < MIN_W) {
        overflow -= MIN_W - w[id];
        w[id] = MIN_W;
      }
    }
    if (Math.abs(overflow) < 1e-8) break;
    const free = ids.filter((id) => w[id] > MIN_W + 1e-9 && w[id] < MAX_W - 1e-9);
    const freeSum = free.reduce((a, id) => a + w[id], 0);
    if (free.length === 0 || freeSum <= 0) break;
    for (const id of free) {
      w[id] += overflow * (w[id] / freeSum);
    }
  }
  const sum = ids.reduce((a, id) => a + w[id], 0);
  return Object.fromEntries(ids.map((id) => [id, w[id] / sum]));
}

export function assertBook(weights: WeightMap): WeightMap {
  const projected = project(weights);
  const sum = ASSET_IDS.reduce((a, id) => a + projected[id], 0);
  if (Math.abs(sum - 1) > 1e-6) {
    throw new Error(`Weights must sum to 1, got ${sum}`);
  }
  for (const id of ASSET_IDS) {
    if (projected[id] < MIN_W - 1e-6 || projected[id] > MAX_W + 1e-6) {
      throw new Error(`Weight for ${id} outside [${MIN_W}, ${MAX_W}]`);
    }
  }
  return projected;
}
