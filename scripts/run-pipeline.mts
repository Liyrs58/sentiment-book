/**
 * Offline pipeline: score sample corpus → weights → backtest curve.
 *   npm run pipeline
 */
import { runResearchPipeline } from "../lib/pipeline";

const report = runResearchPipeline("2025-05");

console.log("Sentiment Book · research pipeline");
console.log(`backend     ${report.backend}`);
console.log(`note         ${report.backendNote}`);
console.log(`articles     ${report.articlesScored}`);
console.log(`edition      ${report.month}`);
console.log("");
console.log("sample scores (editorial)");
for (const row of report.sampleScores) {
  console.log(
    `  ${row.signed.toFixed(3).padStart(7)}  ${row.scores.positive.toFixed(2)}/${row.scores.negative.toFixed(2)}/${row.scores.neutral.toFixed(2)}  ${row.headline}`
  );
}
console.log("");
console.log("super-agent weights (projected)");
for (const row of report.weights) {
  console.log(
    `  ${row.id.padEnd(6)} ${(row.weight * 100).toFixed(1).padStart(5)}%  ${row.name}`
  );
}
const sum = report.weights.reduce((a, r) => a + r.weight, 0);
console.log(`  SUM    ${(sum * 100).toFixed(1)}%`);
console.log("");
const { harlf, equal, spx, rule, curve } = report.backtest;
const last = curve[curve.length - 1];
console.log("walk-forward backtest");
console.log(`  rule       ${rule}`);
console.log(
  `  HARLF      NAV ${last.harlf.toFixed(3)}  CAGR ${(harlf.cagr * 100).toFixed(1)}%  Sharpe ${harlf.sharpe.toFixed(2)}  MDD ${(harlf.maxDrawdown * 100).toFixed(1)}%`
);
console.log(
  `  Equal      NAV ${last.equal.toFixed(3)}  CAGR ${(equal.cagr * 100).toFixed(1)}%  Sharpe ${equal.sharpe.toFixed(2)}  MDD ${(equal.maxDrawdown * 100).toFixed(1)}%`
);
console.log(
  `  S&P 500    NAV ${last.spx.toFixed(3)}  CAGR ${(spx.cagr * 100).toFixed(1)}%  Sharpe ${spx.sharpe.toFixed(2)}  MDD ${(spx.maxDrawdown * 100).toFixed(1)}%`
);
console.log("");
console.log("real");
for (const line of report.real) console.log(`  - ${line}`);
console.log("stubbed");
for (const line of report.stubbed) console.log(`  - ${line}`);

if (report.articlesScored < 50) process.exit(1);
if (Math.abs(sum - 1) > 1e-6) process.exit(1);
if (!(last.harlf > 0)) process.exit(1);
