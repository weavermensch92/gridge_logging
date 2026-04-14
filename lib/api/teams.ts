import { api, isMockMode } from "./client";
import { MOCK_TEAMS, MOCK_USERS } from "@/lib/mockData";
import type { Team } from "@/types";

export const teamsApi = {
  /** 팀 목록 조회 */
  async list() {
    if (isMockMode()) {
      const teams = MOCK_TEAMS.map(t => ({
        ...t,
        member_count: MOCK_USERS.filter(u => u.team_id === t.id).length,
      }));
      return { data: { teams }, error: null };
    }
    return api.get<{ teams: Team[] }>("/api/teams");
  },

  /** 팀 생성 */
  async create(data: { name: string; ai_budget_usd?: number }) {
    if (isMockMode()) {
      const newTeam: Team = {
        id: `team-${Date.now()}`,
        org_id: "org-001",
        name: data.name,
        ai_budget_usd: data.ai_budget_usd,
        member_count: 0,
      };
      return { data: newTeam, error: null };
    }
    return api.post<Team>("/api/teams", data);
  },

  /** 팀 수정 */
  async update(id: string, data: Partial<Pick<Team, "name" | "ai_budget_usd">>) {
    if (isMockMode()) {
      return { data: { id, ...data }, error: null };
    }
    return api.put<Team>(`/api/teams/${id}`, data);
  },

  /** 팀 삭제 */
  async remove(id: string) {
    if (isMockMode()) {
      return { data: { success: true }, error: null };
    }
    return api.delete(`/api/teams/${id}`);
  },
};
