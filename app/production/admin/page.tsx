"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, Users, DollarSign, Shield, Plus, X,
  Loader2, ChevronRight, Settings, UserCog,
  LayoutGrid, FileText, AlertTriangle, Check,
} from "lucide-react";
import clsx from "clsx";
import type { Team } from "@/types";
import { orgApi, teamsApi, usersApi } from "@/lib/api";
import { MOCK_LOGS, MOCK_RISK_ALERTS } from "@/lib/mockData";

type TabKey = "teams" | "logs" | "quota";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "teams", label: "팀 관리",   icon: <LayoutGrid className="w-4 h-4" /> },
  { key: "logs",  label: "최근 로그", icon: <FileText   className="w-4 h-4" /> },
  { key: "quota", label: "한도 요청", icon: <DollarSign  className="w-4 h-4" /> },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("teams");
  const [loading, setLoading] = useState(true);

  // 데이터
  const [teams, setTeams] = useState<Team[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [costData, setCostData] = useState<{ total_used_usd: number; total_budget_usd: number } | null>(null);
  const [quotaRequests, setQuotaRequests] = useState<{
    id: string; user_name: string; requested_amount: number;
    current_quota: number; current_used: number; status: string;
    reason?: string; created_at: string;
  }[]>([]);
  const [showAddTeam, setShowAddTeam] = useState(false);

  const recentLogs = MOCK_LOGS.slice(0, 5);
  const criticalAlerts = MOCK_RISK_ALERTS.filter(a => !a.dismissed);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [teamRes, userRes, costRes, quotaRes] = await Promise.all([
      teamsApi.list(),
      usersApi.list(),
      orgApi.getCostSummary(),
      orgApi.getQuotaRequests(),
    ]);
    if (teamRes.data) setTeams(teamRes.data.teams);
    if (userRes.data) {
      setTotalUsers(userRes.data.total);
      setActiveUsers(userRes.data.users.filter(u => u.status === "active").length);
    }
    if (costRes.data) setCostData({ total_used_usd: costRes.data.total_used_usd, total_budget_usd: costRes.data.total_budget_usd });
    if (quotaRes.data) setQuotaRequests(quotaRes.data.requests);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const pendingQuota = quotaRequests.filter(r => r.status === "pending");

  const handleQuotaAction = async (id: string, action: "approved" | "rejected") => {
    await orgApi.updateQuotaRequest(id, { status: action });
    fetchAll();
  };

  const deleteTeam = async (team: Team) => {
    if (!confirm(`"${team.name}" 팀을 삭제하시겠습니까?`)) return;
    await teamsApi.remove(team.id);
    fetchAll();
  };

  return (
    <main className="min-h-screen p-6" style={{ background: "var(--bg-base)" }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
          style={{ background: "var(--accent)" }} />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: "var(--accent)" }}>
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Softsquared Inc.</h1>
              <p className="text-sm text-gray-500">기업 AI 대시보드 · Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/production/admin/users")}
              className="flex items-center gap-2 px-3 py-2 rounded-xl glass text-sm font-medium text-gray-600 hover:bg-white/60 transition-colors">
              <UserCog className="w-4 h-4" /> 유저 관리
            </button>
            <button onClick={() => router.push("/production/admin/settings")}
              className="flex items-center gap-2 px-3 py-2 rounded-xl glass text-sm font-medium text-gray-600 hover:bg-white/60 transition-colors">
              <Settings className="w-4 h-4" /> 설정
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* 통계 카드 4개 — 클릭 시 해당 페이지 이동 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <button onClick={() => router.push("/production/admin/users")}
                className="glass rounded-2xl p-5 text-left hover:shadow-lg transition-shadow group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">총 유저</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
                <p className="text-3xl font-black text-gray-900">{totalUsers}<span className="text-sm font-normal text-gray-400 ml-1">명</span></p>
              </button>

              <button onClick={() => router.push("/production/admin/users")}
                className="glass rounded-2xl p-5 text-left hover:shadow-lg transition-shadow group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">활성 유저</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
                <p className="text-3xl font-black text-emerald-600">{activeUsers}<span className="text-sm font-normal text-gray-400 ml-1">명</span></p>
              </button>

              <button onClick={() => router.push("/production/admin/settings")}
                className="glass rounded-2xl p-5 text-left hover:shadow-lg transition-shadow group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">이번달 비용</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
                <p className="text-3xl font-black text-gray-900">${costData?.total_used_usd.toFixed(1)}</p>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                  <div className="h-full rounded-full" style={{
                    width: `${costData ? Math.min((costData.total_used_usd / costData.total_budget_usd) * 100, 100) : 0}%`,
                    background: "var(--accent)",
                  }} />
                </div>
              </button>

              <div className="glass rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">보안 알림</span>
                </div>
                <p className="text-3xl font-black text-gray-900">{criticalAlerts.length}<span className="text-sm font-normal text-gray-400 ml-1">건</span></p>
                {criticalAlerts.filter(a => a.severity === "critical").length > 0 && (
                  <p className="text-xs text-red-500 font-medium mt-1">
                    {criticalAlerts.filter(a => a.severity === "critical").length}건 위험
                  </p>
                )}
              </div>
            </div>

            {/* 탭 스위처 */}
            <div className="flex gap-1 glass rounded-xl p-1 mb-6 w-fit">
              {TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    activeTab === tab.key
                      ? "text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
                  )}
                  style={activeTab === tab.key ? { background: "var(--accent)" } : {}}>
                  {tab.icon}
                  {tab.label}
                  {tab.key === "quota" && pendingQuota.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-bold ml-1">
                      {pendingQuota.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* 탭 콘텐츠 */}
            {activeTab === "teams" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map(team => (
                  <div key={team.id} className="glass rounded-2xl p-5 group">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-800">{team.name}</h3>
                      <button onClick={() => deleteTeam(team)}
                        className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="text-center p-2 rounded-lg bg-white/40">
                        <p className="text-xl font-bold text-gray-800">{team.member_count ?? 0}</p>
                        <p className="text-[10px] text-gray-400">멤버</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-white/40">
                        <p className="text-xl font-bold text-gray-800">${(team.used_usd ?? 0).toFixed(0)}</p>
                        <p className="text-[10px] text-gray-400">이번달 비용</p>
                      </div>
                    </div>
                    {team.ai_budget_usd && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">팀 예산</span>
                          <span className="text-gray-500">${team.ai_budget_usd}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{
                            width: `${Math.min(((team.used_usd ?? 0) / team.ai_budget_usd) * 100, 100)}%`,
                            background: "var(--accent)",
                          }} />
                        </div>
                      </div>
                    )}
                    <button onClick={() => router.push(`/production/admin/users?team=${team.id}`)}
                      className="w-full flex items-center justify-center gap-1 text-xs font-medium py-2 rounded-lg hover:bg-white/60 transition-colors"
                      style={{ color: "var(--accent)" }}>
                      멤버 보기 <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* 팀 추가 */}
                <button onClick={() => setShowAddTeam(true)}
                  className="glass rounded-2xl p-5 border-2 border-dashed border-gray-200 hover:border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-gray-600 transition-colors min-h-[200px]">
                  <Plus className="w-6 h-6" />
                  <span className="text-sm font-medium">팀 추가</span>
                </button>
              </div>
            )}

            {activeTab === "logs" && (
              <div className="glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/50 bg-white/20">
                        {["시간", "유저", "팀", "채널", "모델", "비용", "토큰"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentLogs.map(log => (
                        <tr key={log.id} className="border-b border-white/50 hover:bg-white/20 transition-colors">
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">{log.user_name}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{log.team}</td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">{log.channel}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">{log.model}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-gray-700">${log.cost_usd.toFixed(2)}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{(log.input_tokens + log.output_tokens).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t border-white/50 flex justify-between items-center">
                  <p className="text-xs text-gray-400">최근 {recentLogs.length}건 표시</p>
                  <button onClick={() => router.push("/admin")}
                    className="flex items-center gap-1 text-xs font-medium hover:underline"
                    style={{ color: "var(--accent)" }}>
                    전체 로그 보기 <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === "quota" && (
              <div className="glass rounded-2xl p-6">
                {pendingQuota.length === 0 && quotaRequests.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-12">한도 연장 요청이 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {quotaRequests.map(req => (
                      <div key={req.id}
                        className={clsx("rounded-xl border p-4 flex items-center gap-4",
                          req.status === "pending" ? "border-amber-200 bg-amber-50/40" :
                          req.status === "approved" ? "border-green-200 bg-green-50/40" :
                          "border-gray-200 bg-gray-50/40")}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-800">{req.user_name}</span>
                            <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                              req.status === "pending" ? "bg-amber-100 text-amber-700" :
                              req.status === "approved" ? "bg-green-100 text-green-700" :
                              "bg-gray-100 text-gray-500")}>
                              {req.status === "pending" ? "대기중" : req.status === "approved" ? "승인됨" : "거절됨"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            현재 ${req.current_used.toFixed(1)} / ${req.current_quota} · 요청 +${req.requested_amount}
                          </p>
                          {req.reason && <p className="text-xs text-gray-400 mt-1">{req.reason}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-700">+${req.requested_amount}</p>
                          <p className="text-[10px] text-gray-400">{new Date(req.created_at).toLocaleDateString("ko-KR")}</p>
                        </div>
                        {req.status === "pending" && (
                          <div className="flex flex-col gap-1">
                            <button onClick={() => handleQuotaAction(req.id, "approved")}
                              className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg hover:opacity-90 flex items-center gap-1"
                              style={{ background: "var(--accent)" }}>
                              <Check className="w-3 h-3" /> 승인
                            </button>
                            <button onClick={() => handleQuotaAction(req.id, "rejected")}
                              className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200">
                              거절
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-white/50 flex justify-end">
                  <button onClick={() => router.push("/production/admin/settings")}
                    className="flex items-center gap-1 text-xs font-medium hover:underline"
                    style={{ color: "var(--accent)" }}>
                    설정 페이지에서 관리 <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 팀 추가 모달 */}
      {showAddTeam && <AddTeamModal onClose={() => setShowAddTeam(false)} onSuccess={fetchAll} />}
    </main>
  );
}

function AddTeamModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await teamsApi.create({ name, ai_budget_usd: budget ? Number(budget) : undefined });
    setSubmitting(false);
    onSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-2xl p-6 w-[400px] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" style={{ color: "var(--accent)" }} />
            <h3 className="text-lg font-bold text-gray-800">새 팀 추가</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">팀 이름</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              placeholder="예: 마케팅팀"
              className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">팀 예산 (USD, 선택)</label>
            <input type="number" value={budget} onChange={e => setBudget(e.target.value)} min="0" step="50"
              placeholder="미입력 시 무제한"
              className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/60 text-gray-600 hover:bg-white/80 transition-colors">취소</button>
            <button type="submit" disabled={submitting || !name}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: "var(--accent)" }}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
