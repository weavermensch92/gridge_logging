import { api, isMockMode } from "./client";
import type { User, UserRole, AiToolType } from "@/types";
import { MOCK_USERS } from "@/lib/mockData";

type UsersListResponse = {
  users: User[];
  total: number;
  page: number;
  limit: number;
};

type CreateUserPayload = {
  name: string;
  email: string;
  team: string;
  role: UserRole;
  ai_tools: AiToolType[];
  temp_password: string;
};

type UpdateUserPayload = Partial<{
  role: UserRole;
  ai_enabled: boolean;
  team: string;
  ai_tools: AiToolType[];
  ai_quota_usd: number;
}>;

const mockUsers: User[] = MOCK_USERS.map(u => ({
  ...u,
  role: u.role as UserRole,
  ai_enabled: true,
  ai_quota_usd: 50,
  ai_used_usd: Math.round(Math.random() * 40 * 100) / 100,
  ai_tools: ["claude_code" as AiToolType, "cursor" as AiToolType],
  status: "active" as const,
}));

export const usersApi = {
  async list(params?: { team?: string; status?: string; page?: number; limit?: number }) {
    if (isMockMode()) {
      let filtered = [...mockUsers];
      if (params?.team) filtered = filtered.filter(u => u.team === params.team);
      if (params?.status) filtered = filtered.filter(u => u.status === params.status);
      return {
        data: {
          users: filtered,
          total: filtered.length,
          page: params?.page ?? 1,
          limit: params?.limit ?? 50,
        } as UsersListResponse,
      };
    }
    const query = new URLSearchParams();
    if (params?.team) query.set("team", params.team);
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    return api.get<UsersListResponse>(`/api/users?${query}`);
  },

  async create(payload: CreateUserPayload) {
    if (isMockMode()) {
      const newUser: User = {
        id: `u-${String(mockUsers.length + 1).padStart(3, "0")}`,
        name: payload.name,
        email: payload.email,
        team: payload.team,
        role: payload.role,
        ai_enabled: true,
        ai_quota_usd: 50,
        ai_used_usd: 0,
        ai_tools: payload.ai_tools,
        status: "invited",
      };
      mockUsers.push(newUser);
      return { data: newUser };
    }
    return api.post<User>("/api/users", payload);
  },

  async update(id: string, payload: UpdateUserPayload) {
    if (isMockMode()) {
      const idx = mockUsers.findIndex(u => u.id === id);
      if (idx >= 0) Object.assign(mockUsers[idx], payload);
      return { data: { success: true, user: mockUsers[idx] } };
    }
    return api.put<{ success: boolean; user: User }>(`/api/users/${id}`, payload);
  },

  async remove(id: string) {
    if (isMockMode()) {
      const idx = mockUsers.findIndex(u => u.id === id);
      if (idx >= 0) mockUsers[idx].status = "suspended";
      return { data: { success: true } };
    }
    return api.delete<{ success: boolean }>(`/api/users/${id}`);
  },
};
