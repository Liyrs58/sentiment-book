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

export type NewsArticle = {
  id: string;
  date: string;
  month: string;
  ticker: string;
  source: string;
  headline: string;
  dek: string;
  scores: FinbertScores;
  scoredBy: "finbert-paper";
};

export type MonthlyMetrics = {
  month: string;
  returns: Record<string, number>;
  vol: Record<string, number>;
  sharpe: Record<string, number>;
  sortino: Record<string, number>;
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
};
