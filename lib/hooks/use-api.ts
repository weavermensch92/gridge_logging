import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamsApi, usersApi, orgApi, logsApi, riskApi } from "@/lib/api";
import type { Team, User } from "@/types";

// ── 팀 ──
export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const res = await teamsApi.list();
      return res.data?.teams ?? [];
    },
  });
}

// ── 유저 ──
export function useUsers(params?: { team_id?: string; status?: string }) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: async () => {
      const res = await usersApi.list(params);
      return res.data ?? { users: [], total: 0, page: 1, limit: 50 };
    },
  });
}

// ── 비용 현황 ──
export function useCostSummary() {
  return useQuery({
    queryKey: ["cost-summary"],
    queryFn: async () => {
      const res = await orgApi.getCostSummary();
      return res.data ?? null;
    },
  });
}

// ── 한도 요청 ──
export function useQuotaRequests() {
  return useQuery({
    queryKey: ["quota-requests"],
    queryFn: async () => {
      const res = await orgApi.getQuotaRequests();
      return res.data?.requests ?? [];
    },
  });
}

// ── 기업 목록 (super admin) ──
export function useOrgs() {
  return useQuery({
    queryKey: ["orgs"],
    queryFn: async () => {
      const res = await orgApi.listOrgs();
      return res.data?.orgs ?? [];
    },
  });
}

// ── 유저 변경 (optimistic) ──
export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      usersApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
