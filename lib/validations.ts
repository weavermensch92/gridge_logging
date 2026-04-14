import { z } from "zod";

// ── 인증 ──
export const loginSchema = z.object({
  email: z.string().email("유효한 이메일을 입력하세요"),
  password: z.string().min(6, "비밀번호는 최소 6자입니다"),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, "현재 비밀번호를 입력하세요"),
  new_password: z.string().min(8, "새 비밀번호는 최소 8자입니다"),
});

// ── 유저 ──
export const createUserSchema = z.object({
  name: z.string().min(1, "이름을 입력하세요").max(50),
  email: z.string().email("유효한 이메일을 입력하세요"),
  team_id: z.string().min(1, "팀을 선택하세요"),
  role: z.enum(["member", "team_lead", "admin"]),
  ai_tools: z.array(z.enum(["chatgpt", "claude_web", "gemini_web", "claude_code", "cursor"])),
  temp_password: z.string().min(6, "임시 비밀번호는 최소 6자입니다"),
});

export const updateUserSchema = z.object({
  role: z.enum(["member", "team_lead", "admin"]).optional(),
  ai_enabled: z.boolean().optional(),
  team_id: z.string().optional(),
  ai_tools: z.array(z.enum(["chatgpt", "claude_web", "gemini_web", "claude_code", "cursor"])).optional(),
  ai_quota_usd: z.number().min(0).optional(),
});

// ── 팀 ──
export const createTeamSchema = z.object({
  name: z.string().min(1, "팀 이름을 입력하세요").max(50),
  ai_budget_usd: z.number().min(0).optional(),
});

// ── 조직 ──
export const createOrgSchema = z.object({
  name: z.string().min(1, "기업명을 입력하세요").max(100),
  ai_budget_usd: z.number().min(0),
  billing_cycle: z.enum(["monthly", "quarterly"]),
});

export const updateOrgSettingsSchema = z.object({
  ai_budget_usd: z.number().min(0).optional(),
  name: z.string().min(1).max(100).optional(),
});

// ── 보안 규칙 ──
export const riskRuleSchema = z.object({
  name: z.string().min(1, "규칙명을 입력하세요"),
  description: z.string().optional().default(""),
  category: z.enum(["confidential", "non_work", "security", "compliance", "custom"]),
  severity: z.enum(["info", "warning", "critical"]),
  match_field: z.enum(["prompt", "response", "both"]),
  patterns: z.array(z.string().min(1)).min(1, "최소 1개 패턴이 필요합니다"),
});

// ── 한도 요청 ──
export const quotaRequestSchema = z.object({
  requested_amount: z.number().min(1, "요청 금액을 입력하세요"),
  reason: z.string().optional(),
});

// ── 로그 수집 (ingest) ──
export const logIngestSchema = z.object({
  user_id: z.string(),
  channel: z.enum(["anthropic", "openai", "gemini", "extension", "crawler"]),
  model: z.string(),
  prompt: z.string(),
  response: z.string(),
  input_tokens: z.number().int().min(0),
  output_tokens: z.number().int().min(0),
  cost_usd: z.number().min(0),
  latency_ms: z.number().int().min(0),
  mode: z.enum(["chat", "agent"]).optional(),
  agent_detail: z.object({
    session_id: z.string(),
    session_duration_ms: z.number(),
    total_steps: z.number(),
    total_tool_calls: z.number(),
    files_changed: z.array(z.object({
      path: z.string(),
      action: z.enum(["created", "modified", "deleted"]),
      additions: z.number(),
      deletions: z.number(),
      language: z.string(),
    })),
    steps: z.array(z.object({
      step: z.number(),
      phase: z.enum(["plan", "execute", "verify", "iterate"]),
      description: z.string(),
      tool_calls: z.array(z.object({
        id: z.string(),
        type: z.enum(["file_read", "file_write", "bash", "grep", "glob", "edit", "web_search"]),
        input: z.string(),
        output_summary: z.string(),
        timestamp: z.string(),
        duration_ms: z.number(),
      })),
      timestamp: z.string(),
    })),
    code_artifacts: z.array(z.object({
      filename: z.string(),
      language: z.string(),
      snippet: z.string(),
    })).optional(),
    summary: z.string().optional(),
  }).optional(),
});

/** 벌크 로그 수집 */
export const logIngestBulkSchema = z.object({
  logs: z.array(logIngestSchema).min(1).max(100),
  api_key: z.string().min(1),
});

// ── 유틸 ──
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: { field: string; message: string }[] };

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map(issue => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  };
}
