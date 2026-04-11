"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users, DollarSign, Shield, ChevronRight, Loader2,
  BarChart3, Share2, FileText, AlertTriangle,
} from "lucide-react";
import clsx from "clsx";
import type { Team } from "@/types";
import { orgApi, teamsApi, usersApi } from "@/lib/api";
import { MOCK_LOGS, MOCK_RISK_ALERTS, SHARED_FILES } from "@/lib/mockData";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [costData, setCostData] = useState<{ total_used_usd: number; total_budget_usd: number } | null>(null);
  const [pendingQuota, setPendingQuota] = useState(0);

  const criticalAlerts = MOCK_RISK_ALERTS.filter(a => !a.dismissed);
  const recentLogs = MOCK_LOGS.slice(0, 3);
  const recentFiles = SHARED_FILES.slice(0, 3);

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
    if (costRes.data) setCostData(costRes.data);
    if (quotaRes.data) setPendingQuota(quotaRes.data.requests.filter((r: { status: string }) => r.status === "pending").length);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-sm text-gray-500">Softsquared Inc. · 전체 현황 요약</p>
      </div>

      {/* 통계 카드 — 클릭 시 해당 페이지 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Users className="w-4 h-4 text-gray-400" />} label="총 유저"
          value={`${totalUsers}명`} sub={`활성 ${activeUsers}명`}
          onClick={() => router.push("/production/admin/users")} />
        <StatCard icon={<DollarSign className="w-4 h-4 text-gray-400" />} label="이번달 비용"
          value={`$${costData?.total_used_usd.toFixed(0) ?? 0}`}
          sub={`예산 $${costData?.total_budget_usd ?? 0}`}
          onClick={() => router.push("/production/admin/settings")} />
        <StatCard icon={<Shield className="w-4 h-4 text-gray-400" />} label="보안 알림"
          value={`${criticalAlerts.length}건`}
          sub={criticalAlerts.filter(a => a.severity === "critical").length > 0
            ? `${criticalAlerts.filter(a => a.severity === "critical").length}건 위험` : "정상"}
          alert={criticalAlerts.filter(a => a.severity === "critical").length > 0}
          onClick={() => router.push("/production/admin/security")} />
        <StatCard icon={<BarChart3 className="w-4 h-4 text-gray-400" />} label="한도 요청"
          value={`${pendingQuota}건`} sub="승인 대기"
          alert={pendingQuota > 0}
          onClick={() => router.push("/production/admin/settings")} />
      </div>

      {/* 2열 그리드: 좌=팀 + 로그, 우=성숙도 + 파일 + 보안 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측 (2칸) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 팀 현황 */}
          <SectionCard title="팀 현황" icon={<Users className="w-4 h-4" />}
            action={{ label: "팀 관리", onClick: () => router.push(`/production/admin/${teams[0]?.id ?? ""}`) }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {teams.map(team => (
                <button key={team.id} onClick={() => router.push(`/production/admin/${team.id}`)}
                  className="p-3 rounded-xl bg-white/40 hover:bg-white/60 transition-colors text-left group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-gray-800">{team.name}</span>
                    <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-gray-500" />
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>{team.member_count ?? 0}명</span>
                    <span>${(team.used_usd ?? 0).toFixed(0)}</span>
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>

          {/* 최근 로그 */}
          <SectionCard title="최근 AI 로그" icon={<FileText className="w-4 h-4" />}
            action={{ label: "전체 로그", onClick: () => router.push("/production/admin/logs") }}>
            <div className="space-y-2">
              {recentLogs.map(log => (
                <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/40 transition-colors">
                  <span className="text-[10px] text-gray-400 w-20 flex-shrink-0">
                    {new Date(log.timestamp).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-xs font-medium text-gray-700 w-14 flex-shrink-0">{log.user_name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{log.channel}</span>
                  <span className="text-xs text-gray-500 flex-1 truncate">{log.model}</span>
                  <span className="text-xs font-semibold text-gray-700">${log.cost_usd.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* 우측 (1칸) */}
        <div className="space-y-6">
          {/* AI 성숙도 요약 */}
          <SectionCard title="AI 성숙도" icon={<BarChart3 className="w-4 h-4" />}
            action={{ label: "상세 보기", onClick: () => router.push("/production/admin/ai-maturity") }}>
            <div className="space-y-2">
              {[
                { label: "팀 평균 AIMI", value: "Lv.2.5", color: "text-blue-600" },
                { label: "최고 성숙도", value: "Lv.3 (강지수)", color: "text-emerald-600" },
                { label: "성장률 (전월 대비)", value: "+12%", color: "text-emerald-600" },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-1.5">
                  <span className="text-xs text-gray-500">{item.label}</span>
                  <span className={clsx("text-sm font-bold", item.color)}>{item.value}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 공유 파일 요약 */}
          <SectionCard title="공유 파일" icon={<Share2 className="w-4 h-4" />}
            action={{ label: "전체 파일", onClick: () => router.push("/production/admin/files") }}>
            <div className="space-y-2">
              {recentFiles.map(file => (
                <div key={file.id} className="flex items-center gap-2 py-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 font-medium uppercase">{file.fileType}</span>
                  <span className="text-xs text-gray-700 flex-1 truncate">{file.title}</span>
                  <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                    file.status === "공유중" ? "bg-emerald-100 text-emerald-600" :
                    file.status === "초안" ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-500"
                  )}>{file.status}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 보안 요약 */}
          <SectionCard title="보안 알림" icon={<Shield className="w-4 h-4" />}
            action={{ label: "보안 설정", onClick: () => router.push("/production/admin/security") }}>
            <div className="space-y-2">
              {criticalAlerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="flex items-center gap-2 py-1.5">
                  <div className={clsx("w-2 h-2 rounded-full flex-shrink-0",
                    alert.severity === "critical" ? "bg-red-500" :
                    alert.severity === "warning" ? "bg-amber-400" : "bg-blue-400"
                  )} />
                  <span className="text-xs text-gray-600 flex-1 truncate">{alert.matched_pattern}</span>
                  <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                    alert.severity === "critical" ? "bg-red-100 text-red-600" :
                    alert.severity === "warning" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                  )}>{alert.severity}</span>
                </div>
              ))}
              {criticalAlerts.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">보안 알림이 없습니다</p>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, alert, onClick }: {
  icon: React.ReactNode; label: string; value: string; sub: string;
  alert?: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="glass rounded-2xl p-5 text-left hover:shadow-lg transition-shadow group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className={clsx("text-xs mt-0.5", alert ? "text-red-500 font-medium" : "text-gray-400")}>{sub}</p>
    </button>
  );
}

function SectionCard({ title, icon, action, children }: {
  title: string; icon: React.ReactNode;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span style={{ color: "var(--accent)" }}>{icon}</span>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{title}</h2>
        </div>
        {action && (
          <button onClick={action.onClick}
            className="flex items-center gap-1 text-xs font-medium hover:underline"
            style={{ color: "var(--accent)" }}>
            {action.label} <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
