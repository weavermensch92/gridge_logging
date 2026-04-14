import { api, isMockMode } from "./client";
import { MATURITY_DATA, TEAM_MATURITY } from "@/lib/mockData";

export const reportsApi = {
  async getMaturity(userId: string) {
    if (isMockMode()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const individual = TEAM_MATURITY.individuals.find((u: any) => u.userId === userId);
      return { data: { individual, detail: MATURITY_DATA } };
    }
    return api.get<{ individual: unknown; detail: unknown }>(`/api/maturity/${userId}`);
  },

  async listReports(params?: { user_id?: string; page?: number }) {
    if (isMockMode()) {
      return { data: { reports: [], total: 0 } };
    }
    const query = new URLSearchParams();
    if (params?.user_id) query.set("user_id", params.user_id);
    if (params?.page) query.set("page", String(params.page));
    return api.get<{ reports: unknown[]; total: number }>(`/api/reports?${query}`);
  },

  async getReport(id: string) {
    if (isMockMode()) {
      return { data: MATURITY_DATA };
    }
    return api.get(`/api/reports/${id}`);
  },
};
