"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Users, DollarSign, Loader2, UserPlus,
  ToggleLeft, ToggleRight, Trash2, FileText,
  BarChart3, Shield, ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import type { User, Team, AiToolType, Log, RiskAlert } from "@/types";
import { usersApi, teamsApi } from "@/lib/api";
import { MOCK_LOGS, MOCK_RISK_ALERTS, TEAM_MATURITY } from "@/lib/mockData";

const AI_TOOL_LABEL: Record<AiToolType, string> = {
  chatgpt: "ChatGPT", claude_web: "Claude 웹", gemini_web: "Gemini 웹",
  claude_code: "Claude Code", cursor: "Cursor",
};

const ONBOARDING_LABEL: Record<string, string> = {
  password_change: "비밀번호 변경 대기", tool_install: "도구 설치 중", complete: "",
};

type TabKey = "members" | "logs" | "maturity" | "security";

export default function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("members");

  // 로그 필터
  const [logUserFilter, setLogUserFilter] = useState("전체");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [teamRes, userRes] = await Promise.all([
      teamsApi.list(),
      usersApi.list({ team_id: teamId }),
    ]);
    if (teamRes.data) setTeam(teamRes.data.teams.find(t => t.id === teamId) ?? null);
    if (userRes.data) setMembers(userRes.data.users);
    setLoading(false);
  }, [teamId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 팀 이름 매핑
  const teamName = team?.name ?? "";
  const memberNames = useMemo(() => members.map(m => m.name), [members]);

  // 팀 로그 필터
  const teamLogs = useMemo(() =>
    MOCK_LOGS.filter(l => l.team === teamName), [teamName]);
  const filteredLogs = useMemo(() =>
    logUserFilter === "전체" ? teamLogs : teamLogs.filter(l => l.user_name === logUserFilter),
    [teamLogs, logUserFilter]);

  // 팀 보안 알림
  const teamAlerts = useMemo(() => {
    const teamLogIds = new Set(teamLogs.map(l => l.id));
    return MOCK_RISK_ALERTS.filter(a => !a.dismissed && teamLogIds.has(a.log_id));
  }, [teamLogs]);

  // 팀 성숙도
  const teamMaturity = useMemo(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TEAM_MATURITY.individuals.filter((u: any) => u.team === teamName),
    [teamName]);

  const toggleAi = async (user: User) => {
    await usersApi.update(user.id, { ai_enabled: !user.ai_enabled });
    fetchData();
  };

  const suspendUser = async (user: User) => {
    if (!confirm(`${user.name}님을 비활성화하시겠습니까?`)) return;
    await usersApi.remove(user.id);
    fetchData();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }
  if (!team) {
    return <div className="p-6"><p className="text-gray-400">팀을 찾을 수 없습니다.</p></div>;
  }

  const totalCost = members.reduce((s, m) => s + m.ai_used_usd, 0);

  const TABS: { key: TabKey; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "members",  label: "멤버",    icon: <Users className="w-4 h-4" /> },
    { key: "logs",     label: "AI 로그",  icon: <FileText className="w-4 h-4" />, badge: teamLogs.length },
    { key: "maturity", label: "성숙도",   icon: <BarChart3 className="w-4 h-4" /> },
    { key: "security", label: "위험 로그", icon: <Shield className="w-4 h-4" />, badge: teamAlerts.length },
  ];

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
        <p className="text-sm text-gray-500">
          {team.lead_name ? `팀장: ${team.lead_name} · ` : ""}
          팀 멤버 · AI 로그 · 성숙도 · 보안
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-gray-400" /><span className="text-xs font-semibold text-gray-500 uppercase">멤버</span></div>
          <p className="text-2xl font-black text-gray-900">{members.length}<span className="text-sm font-normal text-gray-400 ml-1">명</span></p>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4 text-gray-400" /><span className="text-xs font-semibold text-gray-500 uppercase">비용</span></div>
          <p className="text-2xl font-black text-gray-900">${totalCost.toFixed(0)}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1"><FileText className="w-4 h-4 text-gray-400" /><span className="text-xs font-semibold text-gray-500 uppercase">로그</span></div>
          <p className="text-2xl font-black text-gray-900">{teamLogs.length}<span className="text-sm font-normal text-gray-400 ml-1">건</span></p>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1"><Shield className="w-4 h-4 text-gray-400" /><span className="text-xs font-semibold text-gray-500 uppercase">위험</span></div>
          <p className={clsx("text-2xl font-black", teamAlerts.length > 0 ? "text-red-600" : "text-gray-900")}>{teamAlerts.length}<span className="text-sm font-normal text-gray-400 ml-1">건</span></p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 glass rounded-xl p-1 mb-6 w-fit">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.key ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-white/40")}
            style={activeTab === tab.key ? { background: "var(--accent)" } : {}}>
            {tab.icon}{tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-0.5",
                activeTab === tab.key ? "bg-white/30 text-white" : "bg-gray-200 text-gray-500")}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* 멤버 탭 */}
      {activeTab === "members" && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">팀 멤버</h2>
            <button onClick={() => router.push("/production/admin/users")}
              className="flex items-center gap-1 text-xs font-medium hover:opacity-80" style={{ color: "var(--accent)" }}>
              <UserPlus className="w-3.5 h-3.5" /> 유저 관리
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/50 bg-white/20">
                  {["이름", "이메일", "역할", "AI 권한", "AI 도구", "사용 / 한도", "온보딩", ""].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">멤버가 없습니다.</td></tr>
                ) : members.map(user => (
                  <tr key={user.id} className="border-b border-white/50 hover:bg-white/20 transition-colors">
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px]" style={{ background: "var(--accent)" }}>{user.name[0]}</div><span className="text-sm font-medium text-gray-800">{user.name}</span></div></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{user.email}</td>
                    <td className="px-4 py-3"><span className={clsx("text-[10px] font-semibold px-2 py-0.5 rounded-full", user.role === "admin" ? "bg-blue-100 text-blue-700" : user.role === "team_lead" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600")}>{user.role === "admin" ? "Admin" : user.role === "team_lead" ? "팀장" : "Member"}</span></td>
                    <td className="px-4 py-3"><button onClick={() => toggleAi(user)}>{user.ai_enabled ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-gray-300" />}</button></td>
                    <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{user.ai_tools.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{AI_TOOL_LABEL[t]}</span>)}</div></td>
                    <td className="px-4 py-3 text-xs"><span className="text-gray-700 font-medium">${user.ai_used_usd.toFixed(1)}</span><span className="text-gray-400"> / ${user.ai_quota_usd}</span></td>
                    <td className="px-4 py-3">{user.onboarding_step !== "complete" && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">{ONBOARDING_LABEL[user.onboarding_step]}</span>}</td>
                    <td className="px-4 py-3"><button onClick={() => suspendUser(user)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 로그 탭 — 유저별 필터 */}
      {activeTab === "logs" && (
        <div>
          {/* 유저 필터 */}
          <div className="glass rounded-2xl p-3 mb-4 flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">유저:</span>
            <div className="flex gap-1.5 flex-wrap">
              {["전체", ...memberNames].map(name => (
                <button key={name} onClick={() => setLogUserFilter(name)}
                  className={clsx("text-xs px-3 py-1.5 rounded-full font-medium transition-colors",
                    logUserFilter === name ? "text-white" : "bg-white/60 text-gray-500 hover:bg-white/80")}
                  style={logUserFilter === name ? { background: "var(--accent)" } : {}}>
                  {name}
                </button>
              ))}
            </div>
            <span className="ml-auto text-xs text-gray-400">{filteredLogs.length}건</span>
          </div>

          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/50 bg-white/20">
                    {["시간", "유저", "채널", "모델", "프롬프트", "비용", "토큰"].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">로그가 없습니다.</td></tr>
                  ) : filteredLogs.slice(0, 30).map(log => (
                    <tr key={log.id} className="border-b border-white/50 hover:bg-white/20 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{log.user_name}</td>
                      <td className="px-4 py-3"><span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">{log.channel}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-600">{log.model}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[250px]">{log.prompt}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-gray-700">${log.cost_usd.toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{(log.input_tokens + log.output_tokens).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-white/50">
              <p className="text-xs text-gray-400">{Math.min(filteredLogs.length, 30)}건 표시 · 전체 {filteredLogs.length}건</p>
            </div>
          </div>
        </div>
      )}

      {/* 성숙도 탭 */}
      {activeTab === "maturity" && (
        <div>
          {/* 팀 전체 성숙도 요약 */}
          <div className="glass rounded-2xl p-5 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">팀 전체 성숙도</h2>
            {teamMaturity.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">성숙도 데이터가 없습니다.</p>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-xl bg-white/40">
                  <p className="text-2xl font-black text-gray-900">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(teamMaturity.reduce((s: number, u: any) => s + u.aimiScore, 0) / teamMaturity.length).toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">평균 AIMI</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/40">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <p className="text-2xl font-black text-gray-900">{teamMaturity.reduce((a: any, b: any) => a.aimiScore > b.aimiScore ? a : b).levelLabel}</p>
                  <p className="text-xs text-gray-400 mt-0.5">최고 레벨</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/40">
                  <p className="text-2xl font-black text-gray-900">{teamMaturity.length}<span className="text-sm font-normal text-gray-400 ml-1">명</span></p>
                  <p className="text-xs text-gray-400 mt-0.5">평가 대상</p>
                </div>
              </div>
            )}
          </div>

          {/* 유저별 성숙도 */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/50">
              <h2 className="text-sm font-semibold text-gray-700">유저별 성숙도</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/50 bg-white/20">
                    {["유저", "AIMI 점수", "레벨", "실행형", "하이브리드", "의사결정", "뱃지"].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamMaturity.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">데이터가 없습니다.</td></tr>
                  ) : teamMaturity.map((u: any) => (
                    <tr key={u.userId} className="border-b border-white/50 hover:bg-white/20 transition-colors cursor-pointer"
                      onClick={() => router.push("/developer/report")}>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px]" style={{ background: "var(--accent)" }}>{u.name[0]}</div><span className="text-sm font-medium text-gray-800">{u.name}</span></div></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${u.aimiScore}%`, background: "var(--accent)" }} /></div>
                          <span className="text-xs font-bold text-gray-700">{u.aimiScore}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{u.levelLabel}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-600">{u.strategyDist.execution}%</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{u.strategyDist.hybrid}%</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{u.strategyDist.decision}%</td>
                      <td className="px-4 py-3 text-xs">{u.badge}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 보안/위험 로그 탭 */}
      {activeTab === "security" && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">{team.name} 위험 로그</h2>
            <button onClick={() => router.push("/production/admin/security")}
              className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: "var(--accent)" }}>
              전체 보안 설정 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {teamAlerts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">이 팀에서 발생한 위험 로그가 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/50 bg-white/20">
                    {["심각도", "매칭 패턴", "프롬프트 미리보기", "발생 시간", "로그 ID"].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamAlerts.map(alert => {
                    const log = MOCK_LOGS.find(l => l.id === alert.log_id);
                    return (
                      <tr key={alert.id} className="border-b border-white/50 hover:bg-white/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={clsx("w-2 h-2 rounded-full",
                              alert.severity === "critical" ? "bg-red-500" :
                              alert.severity === "warning" ? "bg-amber-400" : "bg-blue-400")} />
                            <span className={clsx("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                              alert.severity === "critical" ? "bg-red-100 text-red-600" :
                              alert.severity === "warning" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600")}>{alert.severity}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700 font-medium">{alert.matched_pattern}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[250px]">{log?.prompt ?? "-"}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(alert.timestamp).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">{alert.log_id}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
