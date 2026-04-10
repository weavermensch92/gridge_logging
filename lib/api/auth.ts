import { api, isMockMode } from "./client";
import type { User } from "@/types";

type LoginResponse = {
  user: User & { must_change_password: boolean };
  token: string;
};

type MeResponse = User;

const MOCK_ADMIN: User = {
  id: "u-005",
  name: "김태영",
  email: "taeyoung@softsquared.com",
  role: "admin",
  team: "개발팀",
  ai_enabled: true,
  ai_quota_usd: 100,
  ai_used_usd: 42.5,
  ai_tools: ["claude_code", "cursor"],
  status: "active",
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
