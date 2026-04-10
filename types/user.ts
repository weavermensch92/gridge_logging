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

// ── 계층: Super Admin → Organization → Team → User ──
// super_admin: 플랫폼 관리자 — 기업(Organization) 생성/삭제, admin 지정
// admin: 기업 관리자 — 팀(Team) 생성/삭제, 멤버 추가/관리
// member: 팀원 — 본인 AI 사용, 로그 확인

export type Organization = {
  id: string;
  name: string;
  ai_budget_usd: number;
  billing_cycle: "monthly" | "quarterly";
  admin_id?: string;             // 기업 관리자 유저 ID (super_admin이 지정)
  admin_name?: string;           // 조회 편의용
  user_count?: number;           // 조회 시 집계
  team_count?: number;           // 조회 시 집계
  total_used_usd?: number;       // 조회 시 집계
  created_at: string;
};

export type Team = {
  id: string;
  org_id: string;
  name: string;
  ai_budget_usd?: number;       // 팀별 예산 (선택)
  member_count?: number;         // 조회 시 집계
  used_usd?: number;             // 조회 시 집계
};

export type User = {
  id: string;
  org_id?: string;               // super_admin은 플랫폼 레벨이므로 null
  team_id?: string;              // super_admin/admin은 팀 소속 없을 수 있음
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
