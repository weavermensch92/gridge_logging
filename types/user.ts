export type UserRole = "super_admin" | "admin" | "team_lead" | "member";
export type UserStatus = "active" | "suspended" | "invited" | "pending_approval";
export type AiToolType = "chatgpt" | "claude_web" | "gemini_web" | "claude_code" | "cursor";

/** 온보딩 단계 */
export type OnboardingStep =
  | "password_change"    // 1. 비밀번호 변경
  | "tool_setup"         // 2. AI 도구 연동
  | "complete";          // 3. 완료

/** AI 도구 연동 상태 */
export type AiConnectionStatus =
  | "pending_approval"   // 멤버가 신청함, admin 승인 대기
  | "approved"           // admin이 승인/할당함, 연동 대기
  | "connecting"         // 연동 안내 확인, 설치 진행 중
  | "connected"          // 백엔드에서 연동 확인 완료
  | "rejected";          // admin이 거절

/** AI 도구별 연동 정보 (유저당) */
export type AiToolConnection = {
  tool: AiToolType;
  status: AiConnectionStatus;
  method: "shared_account" | "chrome_extension" | "local_proxy";
  requested_at?: string;       // 멤버가 신청한 시간
  approved_at?: string;        // admin이 승인한 시간
  connected_at?: string;       // 연동 확인된 시간
  guide_completed?: boolean;   // 안내 확인 여부
};

// ── 계층: Super Admin → Organization → Team → User ──
// super_admin: 플랫폼 관리자 — 기업(Organization) 생성/삭제, admin 지정
// admin: 기업 관리자 — 팀 생성/삭제, 전체 유저/예산/보안 관리, 가입 승인, AI 할당
// team_lead: 팀장 — 소속 팀 멤버 관리 (추가/삭제/AI 권한), 팀 로그/성숙도 열람
// member: 팀원 — 본인 AI 사용, 로그 확인, AI 도구 신청/연동

export type Organization = {
  id: string;
  name: string;
  ai_budget_usd: number;
  billing_cycle: "monthly" | "quarterly";
  admin_id?: string;
  admin_name?: string;
  user_count?: number;
  team_count?: number;
  total_used_usd?: number;
  created_at: string;
};

export type Team = {
  id: string;
  org_id: string;
  name: string;
  lead_id?: string;
  lead_name?: string;
  ai_budget_usd?: number;
  member_count?: number;
  used_usd?: number;
};

export type User = {
  id: string;
  org_id?: string;
  team_id?: string;
  team_name?: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  ai_enabled: boolean;
  ai_tools: AiToolType[];
  ai_quota_usd: number;
  ai_used_usd: number;
  onboarding_step: OnboardingStep;
  ai_connections?: AiToolConnection[];  // 도구별 연동 상태
  created_at: string;
};
