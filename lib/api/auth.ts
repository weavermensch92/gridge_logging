import { api, isMockMode } from "./client";
import type { User } from "@/types";

type LoginResponse = {
  user: User & { must_change_password: boolean };
  token: string;
};

type MeResponse = User;

const MOCK_ADMIN: User = {
  id: "u-005",
  org_id: "org-001",
  team_id: "team-001",
  team_name: "개발팀",
  name: "김태영",
  email: "taeyoung@softsquared.com",
  role: "admin",
  status: "active",
  ai_enabled: true,
  ai_tools: ["claude_code", "chatgpt"],
  ai_quota_usd: 80,
  ai_used_usd: 45.2,
  onboarding_step: "complete",
  created_at: "2025-03-01T00:00:00Z",
};

export const authApi = {
  async login(email: string, password: string) {
    if (isMockMode()) {
      if (email && password) {
        return {
          data: {
            user: { ...MOCK_ADMIN, must_change_password: false },
            token: "mock-session-token",
          } as LoginResponse,
        };
      }
      return { error: { code: "INVALID_CREDENTIALS", message: "이메일 또는 비밀번호가 올바르지 않습니다." } };
    }
    return api.post<LoginResponse>("/api/auth/login", { email, password });
  },

  async me() {
    if (isMockMode()) {
      return { data: MOCK_ADMIN as MeResponse };
    }
    return api.get<MeResponse>("/api/auth/me");
  },

  async changePassword(currentPassword: string, newPassword: string) {
    if (isMockMode()) {
      return { data: { success: true } };
    }
    return api.post<{ success: boolean }>("/api/auth/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  async logout() {
    if (isMockMode()) {
      return { data: { success: true } };
    }
    return api.post<{ success: boolean }>("/api/auth/logout");
  },
};
