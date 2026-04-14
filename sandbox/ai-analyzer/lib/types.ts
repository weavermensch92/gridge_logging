// 기존 types/ 재사용 + sandbox 확장
export type { Log } from "../../../types/log";
export type { RiskRule, RiskAlert, RiskSeverity } from "../../../types/risk";

export type AnalysisResult = {
  log_id: string;
  risk_level: "critical" | "warning" | "info" | "safe";
  category: "confidential" | "security" | "compliance" | "non_work" | "cost_anomaly" | "safe";
  reason: string;
  coaching_hint: string;
};

export type CoachingInsight = {
  user_id: string;
  user_name: string;
  maturity_score: number;
  strengths: string[];
  improvements: {
    title: string;
    current: string;
    suggestion: string;
    expected_impact: string;
  }[];
  model_optimization?: {
    current_model: string;
    suggested_model: string;
    tasks: string;
    cost_saving: string;
  };
  sdlc_insight: string;
};

export type SuspectReason =
  | "high_tokens"
  | "long_prompt"
  | "large_code_block"
  | "table_data"
  | "email_patterns"
  | "number_patterns"
  | "chain_risk";
