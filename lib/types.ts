export type AssetClass = "Equities" | "Commodities";

export type Asset = {
  id: string;
  ticker: string;
  name: string;
  region: string;
  desk: string;
  assetClass: AssetClass;
  keywords: string[];
};

export type FinbertScores = {
  positive: number;
  negative: number;
  neutral: number;
};

export type ScorerBackend = "finbert-local" | "finbert-hf" | "lexicon";

export type SourceType = "synthetic" | "external" | "manually-curated";

export type RawArticle = {
  id: string;
  date: string;
  month: string;
  ticker: string;
  source: string;
  headline: string;
  dek: string;
  /** True when the print is part of the desk wire (editorial copy). */
  desk?: boolean;
  /** Provenance: synthetic demo, external public feed, or desk-curated chronology. */
  sourceType: SourceType;
  /** Calendar date the content is as-of (ISO YYYY-MM-DD). */
  dataAsOf: string;
  /** True when headline/dek were generated for the demo corpus. */
  generated: boolean;
};

export type NewsArticle = RawArticle & {
  scores: FinbertScores;
  scoredBy: ScorerBackend;
  signed: number;
};

export type MonthlyMetrics = {
  month: string;
  returns: Record<string, number>;
  vol: Record<string, number>;
  sharpe: Record<string, number>;
  sortino: Record<string, number>;
  calmar: Record<string, number>;
  maxDrawdown: Record<string, number>;
  sentiment: Record<string, number>;
  articleCount: Record<string, number>;
};

export type WeightMap = Record<string, number>;

export type AgentOutput = {
  id: string;
  tier: 1 | 2 | 3;
  family: "market" | "nlp" | "meta-market" | "meta-nlp" | "super";
  label: string;
  algorithm: string;
  note: string;
  weights: WeightMap;
};

export type RiskProfile = "balanced" | "offensive" | "defensive";

export type AllocationSnapshot = {
  month: string;
  alpha: number;
  regime: "risk-on" | "mixed" | "risk-off";
  agents: AgentOutput[];
  superWeights: WeightMap;
  equalWeights: WeightMap;
  constraints: PortfolioConstraints;
  shock?: {
    articleId: string;
    ticker: string;
    headline: string;
    signedDelta: number;
  };
  preShockWeights?: WeightMap;
};

export type EquityPoint = {
  month: string;
  harlf: number;
  equal: number;
  spx: number;
};

export type BacktestStats = {
  cagr: number;
  sharpe: number;
  maxDrawdown: number;
  calmar: number;
  volatility: number;
  totalReturn: number;
};

export type BacktestResult = {
  curve: EquityPoint[];
  harlf: BacktestStats;
  equal: BacktestStats;
  spx: BacktestStats;
  rule: string;
  months: number;
};

export type PortfolioConstraints = {
  longOnly: true;
  leverage: 1;
  minWeight: number;
  maxWeight: number;
  sumToOne: true;
  rebalance: "month-end";
  /** Weights formed from month t observations are applied to month t+1 returns. */
  decisionLagMonths: 1;
};

export type PipelineReport = {
  backend: ScorerBackend;
  backendNote: string;
  articlesScored: number;
  sampleScores: {
    id: string;
    headline: string;
    scores: FinbertScores;
    signed: number;
  }[];
  month: string;
  weights: { id: string; name: string; weight: number }[];
  backtest: BacktestResult;
  real: string[];
  stubbed: string[];
};
