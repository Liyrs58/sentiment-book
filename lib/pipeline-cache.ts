import {
  readPipelineCache,
  writePipelineCache,
  type DeskSession,
  type PipelineCacheFile,
  type StoreInfo,
} from "./store";
import type { PipelineReport } from "./types";

export function toPipelineCache(
  report: PipelineReport,
  session?: Partial<DeskSession>
): PipelineCacheFile {
  const savedAt = new Date().toISOString();
  return {
    version: 1,
    kind: "pipeline-cache",
    savedAt,
    backend: report.backend,
    backendNote: report.backendNote,
    articlesScored: report.articlesScored,
    month: report.month,
    weights: report.weights,
    sampleScores: report.sampleScores,
    backtest: {
      rule: report.backtest.rule,
      months: report.backtest.months,
      harlf: {
        cagr: report.backtest.harlf.cagr,
        sharpe: report.backtest.harlf.sharpe,
        maxDrawdown: report.backtest.harlf.maxDrawdown,
        calmar: report.backtest.harlf.calmar,
      },
      equal: {
        cagr: report.backtest.equal.cagr,
        sharpe: report.backtest.equal.sharpe,
        maxDrawdown: report.backtest.equal.maxDrawdown,
        calmar: report.backtest.equal.calmar,
      },
      spx: {
        cagr: report.backtest.spx.cagr,
        sharpe: report.backtest.spx.sharpe,
        maxDrawdown: report.backtest.spx.maxDrawdown,
        calmar: report.backtest.spx.calmar,
      },
    },
    session: {
      month: session?.month ?? report.month,
      updatedAt: session?.updatedAt ?? savedAt,
      paperSubmittedAt: session?.paperSubmittedAt,
    },
  };
}

export async function persistPipelineCache(
  report: PipelineReport,
  session?: Partial<DeskSession>
): Promise<StoreInfo> {
  const existing = await readPipelineCache();
  return writePipelineCache(
    toPipelineCache(report, {
      ...existing?.session,
      ...session,
      month: session?.month ?? report.month,
    })
  );
}
