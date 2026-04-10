export type ReportSummary = {
  id: string;
  seq: number;
  date: string;
  period: string;
  level: string;
  levelLabel: string;
  levelColor: string;
  project: string;
  aiTaskCount: number;
  totalTokens: number;
  totalCostUsd: number;
  topGain: string;
  bottleneck: string;
  keyInsight: string;
  radarScores: { axis: string; score: number }[];
  hasDetail: boolean;
};

export type MaturityData = {
  level: number;
  levelLabel: string;
  prevLevel: number;
  prevLevelLabel: string;
  scores: { axis: string; score: number; prev: number }[];
  coaching: string;
};
