import { api, isMockMode } from "./client";
import type { Log } from "@/types";
import { MOCK_LOGS } from "@/lib/mockData";

type LogsListResponse = {
  logs: Log[];
  total: number;
  page: number;
  limit: number;
};

type LogStatsResponse = {
  total_logs: number;
  total_cost_usd: number;
  active_users: number;
  avg_latency_ms: number;
};

export const logsApi = {
  async list(params?: {
    team?: string;
    user_id?: string;
    channel?: string;
    model?: string;
    mode?: "chat" | "agent";
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    if (isMockMode()) {
      let filtered = [...MOCK_LOGS];
      if (params?.team) filtered = filtered.filter(l => l.team === params.team);
      if (params?.user_id) filtered = filtered.filter(l => l.user_id === params.user_id);
      if (params?.channel) filtered = filtered.filter(l => l.channel === params.channel);
      if (params?.mode) filtered = filtered.filter(l => l.mode === params.mode);
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 50;
      return {
        data: {
          logs: filtered.slice((page - 1) * limit, page * limit),
          total: filtered.length,
          page,
          limit,
        } as LogsListResponse,
      };
    }
    const query = new URLSearchParams();
    if (params?.team) query.set("team", params.team);
    if (params?.user_id) query.set("user_id", params.user_id);
    if (params?.channel) query.set("channel", params.channel);
    if (params?.mode) query.set("mode", params.mode);
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    return api.get<LogsListResponse>(`/api/logs?${query}`);
  },

  async getById(id: string) {
    if (isMockMode()) {
      const log = MOCK_LOGS.find(l => l.id === id);
      return { data: log ?? null };
    }
    return api.get<Log>(`/api/logs/${id}`);
  },

  async getStats() {
    if (isMockMode()) {
      const users = new Set(MOCK_LOGS.map(l => l.user_id));
      return {
        data: {
          total_logs: MOCK_LOGS.length,
          total_cost_usd: MOCK_LOGS.reduce((s, l) => s + l.cost_usd, 0),
          active_users: users.size,
          avg_latency_ms: Math.round(MOCK_LOGS.reduce((s, l) => s + l.latency_ms, 0) / MOCK_LOGS.length),
        } as LogStatsResponse,
      };
    }
    return api.get<LogStatsResponse>("/api/logs/stats");
  },

  /** 벌크 로그 수집 (프록시/익스텐션에서 호출) */
  async ingest(payload: { logs: Partial<Log>[]; api_key: string }) {
    if (isMockMode()) {
      return { data: { ingested: payload.logs.length, errors: 0 } };
    }
    return api.post<{ ingested: number; errors: number }>("/api/logs/ingest", payload);
  },
};
