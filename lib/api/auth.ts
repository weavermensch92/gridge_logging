import { api, isMockMode } from "./client";
import type { User } from "@/types";

type LoginResponse = {
  user: User & { must_change_password: boolean };
  token: string;
};

type MeResponse = User;

/** Mock 계정 목록 — 역할별 테스트 가능 */
const MOCK_ACCOUNTS: Record<string, { password: string; user: User & { must_change_password: boolean } }> = {
  // Super Admin
  "super@gridge.io": {
    password: "super1234",
    user: {
      id: "u-000", name: "플랫폼 관리자", email: "super@gridge.io",
      role: "super_admin", status: "active",
      ai_enabled: false, ai_tools: [], ai_quota_usd: 0, ai_used_usd: 0,
      onboarding_step: "complete", created_at: "2025-01-01T00:00:00Z",
      must_change_password: false,
    },
  },
  // Admin
  "admin@softsquared.com": {
    password: "admin1234",
    user: {
      id: "u-010", org_id: "org-001", name: "정우진", email: "admin@softsquared.com",
      role: "admin", status: "active",
      ai_enabled: false, ai_tools: [], ai_quota_usd: 0, ai_used_usd: 0,
      onboarding_step: "complete", created_at: "2025-02-01T00:00:00Z",
      must_change_password: false,
    },
  },
  // Team Lead
  "taeyoung@softsquared.com": {
    password: "lead1234",
    user: {
      id: "u-005", org_id: "org-001", team_id: "team-001", team_name: "개발팀",
      name: "김태영", email: "taeyoung@softsquared.com",
      role: "team_lead", status: "active",
      ai_enabled: true, ai_tools: ["claude_code", "chatgpt"], ai_quota_usd: 80, ai_used_usd: 45.2,
      onboarding_step: "complete", created_at: "2025-03-01T00:00:00Z",
      must_change_password: false,
    },
  },
  // Member
  "jisoo@softsquared.com": {
    password: "member1234",
    user: {
      id: "u-001", org_id: "org-001", team_id: "team-001", team_name: "개발팀",
      name: "강지수", email: "jisoo@softsquared.com",
      role: "member", status: "active",
      ai_enabled: true, ai_tools: ["claude_code", "claude_web"], ai_quota_usd: 50, ai_used_usd: 32.4,
      onboarding_step: "complete", created_at: "2025-06-01T00:00:00Z",
      must_change_password: false,
    },
  },
  // 신규 (비밀번호 변경 필요)
  "newbie@softsquared.com": {
    password: "temp1234",
    user: {
      id: "u-006", org_id: "org-001", team_id: "team-001", team_name: "개발팀",
      name: "신입사원", email: "newbie@softsquared.com",
      role: "member", status: "invited",
      ai_enabled: false, ai_tools: ["claude_code"], ai_quota_usd: 50, ai_used_usd: 0,
      onboarding_step: "password_change", created_at: "2025-12-10T00:00:00Z",
      must_change_password: true,
    },
  },
};

/** 현재 로그인된 Mock 유저 (세션 시뮬레이션) */
let currentMockUser: (User & { must_change_password: boolean }) | null = null;

export const authApi = {
  async login(email: string, password: string) {
    if (isMockMode()) {
      const account = MOCK_ACCOUNTS[email];
      if (!account || account.password !== password) {
        return { error: { code: "INVALID_CREDENTIALS", message: "이메일 또는 비밀번호가 올바르지 않습니다." } };
      }
      currentMockUser = account.user;
      return {
        data: {
          user: account.user,
          token: `mock-token-${account.user.id}`,
        } as LoginResponse,
      };
    }
    return api.post<LoginResponse>("/api/auth/login", { email, password });
  },

  async me() {
    if (isMockMode()) {
      if (!currentMockUser) {
        // 기본값: admin
        currentMockUser = MOCK_ACCOUNTS["admin@softsquared.com"].user;
      }
      return { data: currentMockUser as MeResponse };
    }
    return api.get<MeResponse>("/api/auth/me");
  },

  async changePassword(currentPassword: string, newPassword: string) {
    if (isMockMode()) {
      if (currentMockUser) {
        currentMockUser.must_change_password = false;
        currentMockUser.onboarding_step = "tool_setup";
        currentMockUser.status = "active";
      }
      return { data: { success: true } };
    }
    return api.post<{ success: boolean }>("/api/auth/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  async logout() {
    if (isMockMode()) {
      currentMockUser = null;
      return { data: { success: true } };
    }
    return api.post<{ success: boolean }>("/api/auth/logout");
  },
};
