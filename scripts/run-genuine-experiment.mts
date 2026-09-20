import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { runGenuineBacktest } from "../lib/genuine-backtest";

const name = "genuine-yahoo-gdelt";
const dir = join("experiments", name);
mkdirSync(dir, { recursive: true });

const result = runGenuineBacktest({ costBps: 10, oosStart: "2025-01" });

const manifest = {
  name,
  createdAt: new Date().toISOString(),
  tapeKind: result.tapeKind,
  priceSource: result.priceSource,
  eventCount: result.eventCount,
  costBps: result.costBps,
  oosStart: result.oosStart,
  methodology: result.methodology,
  limitations: result.limitations,
  months: result.months,
  oosMonths: result.oosMonths,
};

const metrics = {
  avgTurnover: result.avgTurnover,
  totalCostDrag: result.totalCostDrag,
  strategy: result.strategy,
  equal: result.equal,
  benchmarkSpx: result.benchmarkSpx,
  finalNav: {
    strategy: result.curve[result.curve.length - 1]?.strategy,
    equal: result.curve[result.curve.length - 1]?.equal,
    spx: result.curve[result.curve.length - 1]?.spx,
  },
};

writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
writeFileSync(join(dir, "metrics.json"), JSON.stringify(metrics, null, 2));
console.log(JSON.stringify({ wrote: dir, metrics }, null, 2));
