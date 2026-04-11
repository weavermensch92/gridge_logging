"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign, Users, TrendingUp, Check, X, Loader2,
  CreditCard, AlertTriangle, Settings, Building2,
  Bell, Clock, Lock, FileText, Plus, Send,
  ToggleLeft, ToggleRight, Cpu,
} from "lucide-react";
import clsx from "clsx";
import { orgApi } from "@/lib/api";

type TabKey = "cost" | "settings";

/** AI 서비스 신청 목록 */
type AiService = {
  id: string;
  name: string;
  icon: string;
  status: "active" | "pending" | "inactive";
  requested_at?: string;
};

const ALL_AI_SERVICES: Omit<AiService, "status" | "requested_at">[] = [
  { id: "claude", name: "Claude", icon: "C" },
  { id: "gpt", name: "GPT", icon: "G" },
  { id: "claude-code", name: "Claude Code", icon: "CC" },
  { id: "codex", name: "Codex", icon: "CX" },
  { id: "cursor", name: "Cursor", icon: "Cu" },
  { id: "claude-api", name: "Claude API", icon: "CA" },
  { id: "openai-api", name: "OpenAI API", icon: "OA" },
  { id: "bedrock", name: "AWS Bedrock", icon: "BR" },
];

const MOCK_SERVICES: AiService[] = [
  { id: "claude", name: "Claude", icon: "C", status: "active" },
  { id: "gpt", name: "GPT", icon: "G", status: "active" },
  { id: "claude-code", name: "Claude Code", icon: "CC", status: "active" },
  { id: "cursor", name: "Cursor", icon: "Cu", status: "pending", requested_at: "2026-04-05" },
];

const MOCK_AUDIT_LOG = [
  { id: "a1", actor: "김태영", action: "유저 추가", target: "신입사원", time: "2026-04-10 14:32" },
  { id: "a2", actor: "김태영", action: "AI 권한 변경", target: "강지수 → enabled", time: "2026-04-09 11:05" },
  { id: "a3", actor: "김태영", action: "보안 규칙 추가", target: "기밀코드 유출 감지", time: "2026-04-08 16:20" },
  { id: "a4", actor: "김태영", action: "한도 승인", target: "강지수 +$30", time: "2026-04-08 14:15" },
  { id: "a5", actor: "김태영", action: "팀 생성", target: "마케팅팀", time: "2026-04-07 09:40" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("cost");
  const [loading, setLoading] = useState(true);

  // 비용 관리 상태
  const [budget, setBudget] = useState(0);
  const [editBudget, setEditBudget] = useState(false);
  const [newBudget, setNewBudget] = useState("");
  const [savingBudget, setSavingBudget] = useState(false);
  const [costSummary, setCostSummary] = useState<{
    total_budget_usd: number; total_used_usd: number;
    by_team: { team: string; used_usd: number; user_count: number }[];
    by_user: { user_id: string; name: string; team: string; used_usd: number; quota_usd: number }[];
  } | null>(null);
  const [quotaRequests, setQuotaRequests] = useState<{
    id: string; user_name: string; requested_amount: number; current_quota: number;
    current_used: number; status: string; reason?: string; created_at: string;
  }[]>([]);

  // 설정 상태
  const [orgName, setOrgName] = useState("Softsquared Inc.");
  const [orgContact, setOrgContact] = useState("admin@softsquared.com");
  const [services, setServices] = useState<AiService[]>(MOCK_SERVICES);
  const [showServiceModal, setShowServiceModal] = useState(false);

  // 알림 설정
  const [notifyQuotaLimit, setNotifyQuotaLimit] = useState(true);
  const [notifySecurity, setNotifySecurity] = useState(true);
  const [slackWebhook, setSlackWebhook] = useState("");

  // 보관/보안
  const [logRetention, setLogRetention] = useState("90");
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [passwordMinLength, setPasswordMinLength] = useState("8");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [settingsRes, costRes, quotaRes] = await Promise.all([
      orgApi.getSettings(), orgApi.getCostSummary(), orgApi.getQuotaRequests(),
    ]);
    if (settingsRes.data) { setBudget(settingsRes.data.ai_budget_usd); setNewBudget(String(settingsRes.data.ai_budget_usd)); }
    if (costRes.data) setCostSummary(costRes.data);
    if (quotaRes.data) setQuotaRequests(quotaRes.data.requests);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveBudget = async () => {
    setSavingBudget(true);
    await orgApi.updateSettings({ ai_budget_usd: Number(newBudget) });
    setBudget(Number(newBudget));
    setEditBudget(false);
    setSavingBudget(false);
  };

  const handleQuotaAction = async (id: string, action: "approved" | "rejected") => {
    await orgApi.updateQuotaRequest(id, { status: action });
    fetchData();
  };

  const requestService = (svc: Omit<AiService, "status" | "requested_at">) => {
    setServices(prev => [...prev, { ...svc, status: "pending", requested_at: new Date().toISOString().split("T")[0] }]);
    setShowServiceModal(false);
  };

  const usedPct = costSummary ? (costSummary.total_used_usd / costSummary.total_budget_usd) * 100 : 0;

  return (
    <div className="p-6 max-w-5xl">
      {/* 탭 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex gap-1 glass rounded-xl p-1">
          <button onClick={() => setActiveTab("cost")}
            className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === "cost" ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-white/40")}
            style={activeTab === "cost" ? { background: "var(--accent)" } : {}}>
            <CreditCard className="w-4 h-4" /> 비용 관리
          </button>
          <button onClick={() => setActiveTab("settings")}
            className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === "settings" ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-white/40")}
            style={activeTab === "settings" ? { background: "var(--accent)" } : {}}>
            <Settings className="w-4 h-4" /> 설정
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : activeTab === "cost" ? (
        /* ══════════ 비용 관리 탭 ══════════ */
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">비용 관리</h1>
            <p className="text-sm text-gray-500">월간 AI 예산 및 유저별 한도 관리</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass rounded-2xl p-6 col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" style={{ color: "var(--accent)" }} />
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">월간 AI 예산</h2>
                </div>
                {!editBudget ? (
                  <button onClick={() => setEditBudget(true)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                    <Settings className="w-3 h-3" /> 변경
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input type="number" value={newBudget} onChange={e => setNewBudget(e.target.value)}
                      className="w-24 px-2 py-1 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none" />
                    <button onClick={saveBudget} disabled={savingBudget} className="p-1 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200">
                      {savingBudget ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button onClick={() => { setEditBudget(false); setNewBudget(String(budget)); }} className="p-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-black text-gray-900">${costSummary?.total_used_usd.toFixed(1)}</span>
                <span className="text-lg text-gray-400 mb-1">/ ${budget}</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div className="h-full rounded-full transition-all" style={{
                  width: `${Math.min(usedPct, 100)}%`,
                  background: usedPct > 80 ? "#ef4444" : usedPct > 60 ? "#f59e0b" : "var(--accent)",
                }} />
              </div>
              <p className="text-xs text-gray-400">{usedPct.toFixed(1)}% 사용 · 잔여 ${(budget - (costSummary?.total_used_usd ?? 0)).toFixed(1)}</p>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">팀별 비용</h2>
              </div>
              <div className="space-y-3">
                {costSummary?.by_team.map(t => {
                  const pct = budget > 0 ? (t.used_usd / budget) * 100 : 0;
                  return (
                    <div key={t.team}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 font-medium">{t.team}</span>
                        <span className="text-gray-500">${t.used_usd.toFixed(1)} ({t.user_count}명)</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--accent)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 유저별 비용 */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">유저별 비용 현황</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/50">
                    {["유저", "팀", "사용량", "한도", "사용률", ""].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {costSummary?.by_user.map(u => {
                    const pct = u.quota_usd > 0 ? (u.used_usd / u.quota_usd) * 100 : 0;
                    const overLimit = pct >= 90;
                    return (
                      <tr key={u.user_id} className="border-b border-white/30 hover:bg-white/20">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{u.name}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{u.team}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-700">${u.used_usd.toFixed(1)}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">${u.quota_usd.toFixed(0)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: overLimit ? "#ef4444" : "var(--accent)" }} />
                            </div>
                            <span className={clsx("text-xs font-medium", overLimit ? "text-red-500" : "text-gray-500")}>{pct.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{overLimit && <AlertTriangle className="w-4 h-4 text-red-400" />}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 한도 연장 요청 */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">한도 연장 요청</h2>
              {quotaRequests.filter(r => r.status === "pending").length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">
                  {quotaRequests.filter(r => r.status === "pending").length}건 대기
                </span>
              )}
            </div>
            {quotaRequests.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">한도 연장 요청이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {quotaRequests.map(req => (
                  <div key={req.id}
                    className={clsx("rounded-xl border p-4 flex items-center gap-4",
                      req.status === "pending" ? "border-amber-200 bg-amber-50/40" :
                      req.status === "approved" ? "border-green-200 bg-green-50/40" : "border-gray-200 bg-gray-50/40")}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-800">{req.user_name}</span>
                        <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                          req.status === "pending" ? "bg-amber-100 text-amber-700" :
                          req.status === "approved" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
                          {req.status === "pending" ? "대기중" : req.status === "approved" ? "승인됨" : "거절됨"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">현재 ${req.current_used.toFixed(1)} / ${req.current_quota} · 요청 +${req.requested_amount}</p>
                      {req.reason && <p className="text-xs text-gray-400 mt-1">{req.reason}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-700">+${req.requested_amount}</p>
                      <p className="text-[10px] text-gray-400">{new Date(req.created_at).toLocaleDateString("ko-KR")}</p>
                    </div>
                    {req.status === "pending" && (
                      <div className="flex flex-col gap-1">
                        <button onClick={() => handleQuotaAction(req.id, "approved")}
                          className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg hover:opacity-90" style={{ background: "var(--accent)" }}>승인</button>
                        <button onClick={() => handleQuotaAction(req.id, "rejected")}
                          className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200">거절</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ══════════ 설정 탭 ══════════ */
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">설정</h1>
            <p className="text-sm text-gray-500">조직 정보, AI 서비스, 알림, 보안 정책</p>
          </div>

          {/* 조직 기본 정보 */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4" style={{ color: "var(--accent)" }} />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">조직 기본 정보</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">조직명</label>
                <input type="text" value={orgName} onChange={e => setOrgName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">관리자 연락처</label>
                <input type="email" value={orgContact} onChange={e => setOrgContact(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
            </div>
          </div>

          {/* AI 서비스 신청 관리 */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4" style={{ color: "var(--accent)" }} />
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">AI 서비스 관리</h2>
              </div>
              <button onClick={() => setShowServiceModal(true)}
                className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: "var(--accent)" }}>
                <Plus className="w-3 h-3" /> 서비스 신청
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">AI 서비스는 고객이 직접 설정하지 않습니다. 그릿지에 신규 도입을 신청하면 승인 후 활성화됩니다.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {services.map(svc => (
                <div key={svc.id} className={clsx("rounded-xl border p-3 flex items-center gap-3",
                  svc.status === "active" ? "border-emerald-200 bg-emerald-50/40" :
                  svc.status === "pending" ? "border-amber-200 bg-amber-50/40" : "border-gray-200 bg-gray-50/40")}>
                  <div className={clsx("w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white",
                    svc.status === "active" ? "" : "opacity-60")}
                    style={{ background: "var(--accent)" }}>
                    {svc.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{svc.name}</p>
                    <span className={clsx("text-[10px] font-medium",
                      svc.status === "active" ? "text-emerald-600" :
                      svc.status === "pending" ? "text-amber-600" : "text-gray-400")}>
                      {svc.status === "active" ? "활성" : svc.status === "pending" ? "신청중" : "비활성"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 알림 설정 */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4" style={{ color: "var(--accent)" }} />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">알림 설정</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">한도 초과 알림</p>
                  <p className="text-xs text-gray-400">유저가 AI 한도의 90% 이상 사용 시 알림</p>
                </div>
                <button onClick={() => setNotifyQuotaLimit(v => !v)}>
                  {notifyQuotaLimit ? <ToggleRight className="w-7 h-7 text-green-500" /> : <ToggleLeft className="w-7 h-7 text-gray-300" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">보안 알림</p>
                  <p className="text-xs text-gray-400">Critical 보안 규칙 매칭 시 즉시 알림</p>
                </div>
                <button onClick={() => setNotifySecurity(v => !v)}>
                  {notifySecurity ? <ToggleRight className="w-7 h-7 text-green-500" /> : <ToggleLeft className="w-7 h-7 text-gray-300" />}
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Slack Webhook URL (선택)</label>
                <input type="url" value={slackWebhook} onChange={e => setSlackWebhook(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
            </div>
          </div>

          {/* 데이터 보관 정책 */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4" style={{ color: "var(--accent)" }} />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">데이터 보관 정책</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">로그 보관 기간 (일)</label>
                <select value={logRetention} onChange={e => setLogRetention(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none focus:ring-2 focus:ring-blue-200">
                  <option value="30">30일</option>
                  <option value="90">90일</option>
                  <option value="180">180일</option>
                  <option value="365">1년</option>
                  <option value="0">무제한</option>
                </select>
                <p className="text-[10px] text-gray-400 mt-1">보관 기간 경과 시 자동 삭제됩니다.</p>
              </div>
            </div>
          </div>

          {/* 보안 정책 */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4" style={{ color: "var(--accent)" }} />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">보안 정책</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">비밀번호 최소 길이</label>
                <select value={passwordMinLength} onChange={e => setPasswordMinLength(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none focus:ring-2 focus:ring-blue-200">
                  <option value="6">6자 이상</option>
                  <option value="8">8자 이상</option>
                  <option value="10">10자 이상</option>
                  <option value="12">12자 이상</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">세션 타임아웃 (분)</label>
                <select value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none focus:ring-2 focus:ring-blue-200">
                  <option value="15">15분</option>
                  <option value="30">30분</option>
                  <option value="60">1시간</option>
                  <option value="120">2시간</option>
                  <option value="0">없음</option>
                </select>
              </div>
            </div>
          </div>

          {/* 감사 로그 */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4" style={{ color: "var(--accent)" }} />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">최근 감사 로그</h2>
            </div>
            <div className="space-y-2">
              {MOCK_AUDIT_LOG.map(log => (
                <div key={log.id} className="flex items-center gap-3 py-2 border-b border-white/30 last:border-0">
                  <span className="text-xs text-gray-400 w-28 flex-shrink-0">{log.time}</span>
                  <span className="text-xs font-medium text-gray-700 w-16 flex-shrink-0">{log.actor}</span>
                  <span className="text-xs text-gray-500">{log.action}</span>
                  <span className="text-xs text-gray-400 ml-auto">{log.target}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI 서비스 신청 모달 */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowServiceModal(false)}>
          <div className="glass rounded-2xl p-6 w-[480px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5" style={{ color: "var(--accent)" }} />
                <h3 className="text-lg font-bold text-gray-800">AI 서비스 도입 신청</h3>
              </div>
              <button onClick={() => setShowServiceModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-gray-400 mb-4">신청하면 그릿지 팀에서 검토 후 활성화합니다. 이미 활성/신청중인 서비스는 표시됩니다.</p>
            <div className="grid grid-cols-2 gap-3">
              {ALL_AI_SERVICES.map(svc => {
                const existing = services.find(s => s.id === svc.id);
                const disabled = !!existing;
                return (
                  <button key={svc.id} onClick={() => !disabled && requestService(svc)} disabled={disabled}
                    className={clsx("rounded-xl border p-3 flex items-center gap-3 transition-colors text-left",
                      disabled ? "border-gray-200 bg-gray-50/40 opacity-60 cursor-not-allowed" : "border-white/80 hover:border-blue-200 hover:bg-blue-50/20")}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: "var(--accent)" }}>
                      {svc.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{svc.name}</p>
                      {existing ? (
                        <span className={clsx("text-[10px] font-medium",
                          existing.status === "active" ? "text-emerald-600" : "text-amber-600")}>
                          {existing.status === "active" ? "이미 활성" : "신청중"}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">신청 가능</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
