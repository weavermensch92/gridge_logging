export type UserRole = "super_admin" | "admin" | "member";
export type UserStatus = "active" | "suspended" | "invited";
export type AiToolType = "chatgpt" | "claude_web" | "gemini_web" | "claude_code" | "cursor";

/** 온보딩 단계 */
export type OnboardingStep =
  | "password_change"    // 1. 비밀번호 변경
  | "tool_install"       // 2. AI 도구별 설치 안내
  | "complete";          // 3. 완료

/** AI 도구별 설치 안내 정보 */
export type AiToolSetup = {
  tool: AiToolType;
  method: "shared_account" | "chrome_extension" | "local_proxy";
  installed: boolean;
  guide_url?: string;
};

// ── 계층: Organization → Team → User ──

export type Organization = {
  id: string;
  name: string;
  ai_budget_usd: number;
  billing_cycle: "monthly" | "quarterly";
  created_at: string;
};

export type Team = {
  id: string;
  org_id: string;
  name: string;
  ai_budget_usd?: number;       // 팀별 예산 (선택)
  member_count?: number;         // 조회 시 집계
};

export type User = {
  id: string;
  org_id: string;
  team_id: string;
  team_name?: string;            // 조회 편의용 (join)
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  ai_enabled: boolean;
  ai_tools: AiToolType[];
  ai_quota_usd: number;
  ai_used_usd: number;
  onboarding_step: OnboardingStep;
  tool_setups?: AiToolSetup[];   // 온보딩 시 도구별 설치 상태
  created_at: string;
};
