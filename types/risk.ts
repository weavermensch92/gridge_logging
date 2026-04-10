export type RiskSeverity = "info" | "warning" | "critical";
export type RiskCategory = "confidential" | "non_work" | "security" | "compliance" | "custom";

export type RiskRule = {
  id: string;
  name: string;
  description: string;
  category: RiskCategory;
  severity: RiskSeverity;
  enabled: boolean;
  patterns: string[];
  match_field: "prompt" | "response" | "both";
  created_at: string;
  updated_at: string;
};

export type RiskAlert = {
  id: string;
  rule_id: string;
  log_id: string;
  severity: RiskSeverity;
  matched_pattern: string;
  matched_text_preview: string;
  timestamp: string;
  dismissed: boolean;
};
