import { api, isMockMode } from "./client";
import type { RiskRule, RiskAlert, RiskException } from "@/types";
import { MOCK_RISK_RULES, MOCK_RISK_ALERTS } from "@/lib/mockData";

export const riskApi = {
  // ── 규칙 ──
  async listRules() {
    if (isMockMode()) return { data: { rules: [...MOCK_RISK_RULES] } };
    return api.get<{ rules: RiskRule[] }>("/api/risk-rules");
  },

  async createRule(payload: Omit<RiskRule, "id" | "created_at" | "updated_at">) {
    if (isMockMode()) {
      const now = new Date().toISOString();
      return { data: { ...payload, id: `rule-${Date.now()}`, created_at: now, updated_at: now } as RiskRule };
    }
    return api.post<RiskRule>("/api/risk-rules", payload);
  },

  async updateRule(id: string, payload: Partial<RiskRule>) {
    if (isMockMode()) return { data: { success: true } };
    return api.put<{ success: boolean }>(`/api/risk-rules/${id}`, payload);
  },

  async deleteRule(id: string) {
    if (isMockMode()) return { data: { success: true } };
    return api.delete<{ success: boolean }>(`/api/risk-rules/${id}`);
  },

  // ── 알림 ──
  async listAlerts(params?: { severity?: string; team?: string }) {
    if (isMockMode()) {
      let alerts = MOCK_RISK_ALERTS.filter(a => !a.dismissed);
      if (params?.severity) alerts = alerts.filter(a => a.severity === params.severity);
      return { data: { alerts } };
    }
    const query = new URLSearchParams();
    if (params?.severity) query.set("severity", params.severity);
    if (params?.team) query.set("team", params.team);
    return api.get<{ alerts: RiskAlert[] }>(`/api/risk-alerts?${query}`);
  },

  async dismissAlert(id: string) {
    if (isMockMode()) return { data: { success: true } };
    return api.put<{ success: boolean }>(`/api/risk-alerts/${id}/dismiss`);
  },

  // ── 예외 ──
  async listExceptions() {
    if (isMockMode()) return { data: { exceptions: [] as RiskException[] } };
    return api.get<{ exceptions: RiskException[] }>("/api/risk-exceptions");
  },

  async createException(payload: Omit<RiskException, "id" | "created_at">) {
    if (isMockMode()) {
      return { data: { ...payload, id: `exc-${Date.now()}`, created_at: new Date().toISOString() } as RiskException };
    }
    return api.post<RiskException>("/api/risk-exceptions", payload);
  },

  async deleteException(id: string) {
    if (isMockMode()) return { data: { success: true } };
    return api.delete<{ success: boolean }>(`/api/risk-exceptions/${id}`);
  },
};
