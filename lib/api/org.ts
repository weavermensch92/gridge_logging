import { api, isMockMode } from "./client";

type OrgSettings = {
  id: string;
  name: string;
  ai_budget_usd: number;
  billing_cycle: string;
  billing_reset_day: number;
};

type CostSummary = {
  total_budget_usd: number;
  total_used_usd: number;
  by_team: { team: string; used_usd: number; user_count: number }[];
  by_user: { user_id: string; name: string; team: string; used_usd: number; quota_usd: number }[];
};

type QuotaRequest = {
  id: string;
  user_id: string;
  user_name: string;
  requested_amount: number;
  current_quota: number;
  current_used: number;
  status: "pending" | "approved" | "rejected";
  reason?: string;
  created_at: string;
};

const mockSettings: OrgSettings = {
  id: "org-001",
  name: "Softsquared Inc.",
  ai_budget_usd: 1000,
  billing_cycle: "monthly",
  billing_reset_day: 1,
};

const mockQuotaRequests: QuotaRequest[] = [
  {
    id: "qr-001",
    user_id: "u-001",
    user_name: "강지수",
    requested_amount: 30,
    current_quota: 50,
    current_used: 48.5,
    status: "pending",
    reason: "이번 주 프로젝트 마감으로 추가 사용 필요",
    created_at: "2026-04-08T14:00:00Z",
  },
];

export const orgApi = {
  async getSettings() {
    if (isMockMode()) {
      return { data: mockSettings };
    }
    return api.get<OrgSettings>("/api/org/settings");
  },

  async updateSettings(payload: Partial<OrgSettings>) {
    if (isMockMode()) {
      Object.assign(mockSettings, payload);
      return { data: mockSettings };
    }
    return api.put<OrgSettings>("/api/org/settings", payload);
  },

  async getCostSummary(params?: { period?: string; from?: string; to?: string }) {
    if (isMockMode()) {
      return {
        data: {
          total_budget_usd: 1000,
          total_used_usd: 342.5,
          by_team: [
            { team: "개발팀", used_usd: 210.3, user_count: 3 },
            { team: "디자인팀", used_usd: 78.2, user_count: 1 },
            { team: "기획팀", used_usd: 54.0, user_count: 1 },
          ],
          by_user: [
            { user_id: "u-001", name: "강지수", team: "개발팀", used_usd: 95.2, quota_usd: 50 },
            { user_id: "u-002", name: "이민준", team: "개발팀", used_usd: 72.1, quota_usd: 50 },
            { user_id: "u-003", name: "박서연", team: "디자인팀", used_usd: 78.2, quota_usd: 50 },
            { user_id: "u-004", name: "최현우", team: "기획팀", used_usd: 54.0, quota_usd: 50 },
            { user_id: "u-005", name: "김태영", team: "개발팀", used_usd: 43.0, quota_usd: 100 },
          ],
        } as CostSummary,
      };
    }
    const query = new URLSearchParams();
    if (params?.period) query.set("period", params.period);
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    return api.get<CostSummary>(`/api/org/cost-summary?${query}`);
  },

  async getQuotaRequests() {
    if (isMockMode()) {
      return { data: { requests: mockQuotaRequests } };
    }
    return api.get<{ requests: QuotaRequest[] }>("/api/quota-requests");
  },

  async createQuotaRequest(payload: { requested_amount: number; reason?: string }) {
    if (isMockMode()) {
      const req: QuotaRequest = {
        id: `qr-${Date.now()}`,
        user_id: "u-001",
        user_name: "강지수",
        requested_amount: payload.requested_amount,
        current_quota: 50,
        current_used: 48.5,
        status: "pending",
        reason: payload.reason,
        created_at: new Date().toISOString(),
      };
      mockQuotaRequests.push(req);
      return { data: req };
    }
    return api.post<QuotaRequest>("/api/quota-requests", payload);
  },

  async updateQuotaRequest(id: string, payload: { status: "approved" | "rejected"; approved_amount?: number }) {
    if (isMockMode()) {
      const req = mockQuotaRequests.find(r => r.id === id);
      if (req) req.status = payload.status;
      return { data: { success: true } };
    }
    return api.put<{ success: boolean }>(`/api/quota-requests/${id}`, payload);
  },
};
