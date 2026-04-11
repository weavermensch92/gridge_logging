"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users, DollarSign, FileText, Shield,
  ChevronRight, Loader2, BarChart3,
} from "lucide-react";
import clsx from "clsx";
import type { User, Team } from "@/types";
import { usersApi, teamsApi } from "@/lib/api";
import { MOCK_LOGS, MOCK_RISK_ALERTS, TEAM_MATURITY } from "@/lib/mockData";

/** Mock: 현재 팀장의 팀 ID — 실제로는 auth에서 가져옴 */
const MY_TEAM_ID = "team-001";

export default function TeamLeadDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<User[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [teamRes, userRes] = await Promise.all([
      teamsApi.list(),
      usersApi.list({ team_id: MY_TEAM_ID }),
    ]);
    if (teamRes.data) setTeam(teamRes.data.teams.find(t => t.id === MY_TEAM_ID) ?? null);
    if (userRes.data) setMembers(userRes.data.users);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const teamName = team?.name ?? "";
  const teamLogs = useMemo(() => MOCK_LOGS.filter(l => l.team === teamName), [teamName]);
  const teamAlerts = useMemo(() => {
    const logIds = new Set(teamLogs.map(l => l.id));
    return MOCK_RISK_ALERTS.filter(a => !a.dismissed && logIds.has(a.log_id));
  }, [teamLogs]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teamMaturity = useMemo(() => TEAM_MATURITY.individuals.filter((u: any) => u.team === teamName), [teamName]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avgAimi = teamMaturity.length > 0 ? teamMaturity.reduce((s: number, u: any) => s + u.aimiScore, 0) / teamMaturity.length : 0;

  const totalCost = members.reduce((s, m) => s + m.ai_used_usd, 0);
  const recentLogs = teamLogs.slice(0, 4);

  if (loading) {
    return <div className="flex items-center justify-center h-full min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{teamName} 현황</h1>
        <p className="text-sm text-gray-500">팀장: 김태영 · 팀원 관리 · 로그 · 성숙도</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Users className="w-4 h-4 text-gray-400" />} label="팀원"
          value={`${members.length}명`} sub={`활성 ${members.filter(m => m.status === "active").length}명`}
          onClick={() => router.push("/production/team-lead/members")} />
        <StatCard icon={<DollarSign className="w-4 h-4 text-gray-400" />} label="이번달 비용"
          value={`$${totalCost.toFixed(0)}`} sub={team?.ai_budget_usd ? `예산 $${team.ai_budget_usd}` : "무제한"} />
        <StatCard icon={<BarChart3 className="w-4 h-4 text-gray-400" />} label="팀 평균 AIMI"
          value={avgAimi.toFixed(1)} sub={`${teamMaturity.length}명 평가`}
          onClick={() => router.push("/production/team-lead/maturity")} />
        <StatCard icon={<Shield className="w-4 h-4 text-gray-400" />} label="위험 알림"
          value={`${teamAlerts.length}건`}
          sub={teamAlerts.filter(a => a.severity === "critical").length > 0 ? `${teamAlerts.filter(a => a.severity === "critical").length}건 위험` : "정상"}
          alert={teamAlerts.filter(a => a.severity === "critical").length > 0}
          onClick={() => router.push("/production/team-lead/security")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 팀원 현황 */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: "var(--accent)" }} />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">팀원</h2>
            </div>
            <button onClick={() => router.push("/production/team-lead/members")}
              className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: "var(--accent)" }}>
              관리 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {members.slice(0, 5).map(m => (
              <div key={m.id} className="flex items-center gap-3 py-1.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px]"
                  style={{ background: "var(--accent)" }}>{m.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                  <p className="text-[10px] text-gray-400">{m.role === "team_lead" ? "팀장" : "Member"}</p>
                </div>
                <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                  m.ai_enabled ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400")}>
                  {m.ai_enabled ? "AI 활성" : "AI 비활성"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 최근 로그 */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: "var(--accent)" }} />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">최근 로그</h2>
            </div>
            <button onClick={() => router.push("/production/team-lead/logs")}
              className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: "var(--accent)" }}>
              전체 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {recentLogs.map(log => (
              <div key={log.id} className="flex items-center gap-3 py-1.5">
                <span className="text-[10px] text-gray-400 w-16 flex-shrink-0">
                  {new Date(log.timestamp).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="text-xs font-medium text-gray-700 w-12 flex-shrink-0">{log.user_name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{log.channel}</span>
                <span className="text-xs text-gray-500 flex-1 truncate">{log.model}</span>
                <span className="text-xs font-semibold text-gray-700">${log.cost_usd.toFixed(2)}</span>
              </div>
            ))}
            {recentLogs.length === 0 && <p className="text-xs text-gray-400 text-center py-4">로그가 없습니다.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, alert, onClick }: {
  icon: React.ReactNode; label: string; value: string; sub: string;
  alert?: boolean; onClick?: () => void;
}) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper onClick={onClick} className={clsx("glass rounded-2xl p-4 text-left transition-shadow", onClick && "hover:shadow-lg group")}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
        </div>
        {onClick && <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-gray-500" />}
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className={clsx("text-xs mt-0.5", alert ? "text-red-500 font-medium" : "text-gray-400")}>{sub}</p>
    </Wrapper>
  );
}
