"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, DollarSign, Users, TrendingUp,
  Check, X, Loader2, Settings, CreditCard,
  AlertTriangle,
} from "lucide-react";
import clsx from "clsx";
import { orgApi } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState(0);
  const [editBudget, setEditBudget] = useState(false);
  const [newBudget, setNewBudget] = useState("");
  const [savingBudget, setSavingBudget] = useState(false);
  const [costSummary, setCostSummary] = useState<{
    total_budget_usd: number;
    total_used_usd: number;
    by_team: { team: string; used_usd: number; user_count: number }[];
    by_user: { user_id: string; name: string; team: string; used_usd: number; quota_usd: number }[];
  } | null>(null);
  const [quotaRequests, setQuotaRequests] = useState<{
    id: string;
    user_name: string;
    requested_amount: number;
    current_quota: number;
    current_used: number;
    status: string;
    reason?: string;
    created_at: string;
  }[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [settingsRes, costRes, quotaRes] = await Promise.all([
      orgApi.getSettings(),
      orgApi.getCostSummary(),
      orgApi.getQuotaRequests(),
    ]);
    if (settingsRes.data) {
      setBudget(settingsRes.data.ai_budget_usd);
      setNewBudget(String(settingsRes.data.ai_budget_usd));
    }
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

  const usedPct = costSummary ? (costSummary.total_used_usd / costSummary.total_budget_usd) * 100 : 0;

  return (
    <main className="min-h-screen p-6" style={{ background: "var(--bg-base)" }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
          style={{ background: "var(--accent)" }} />
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.push("/production/admin")}
            className="p-2 rounded-xl glass hover:scale-105 transition-transform">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">조직 설정 & AI 비용 관리</h1>
            <p className="text-sm text-gray-500">Softsquared Inc. · 월간 AI 예산 및 유저별 한도 관리</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass rounded-2xl p-6 col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" style={{ color: "var(--accent)" }} />
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">월간 AI 예산</h2>
                  </div>
                  {!editBudget ? (
                    <button onClick={() => setEditBudget(true)}
                      className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                      <Settings className="w-3 h-3" /> 변경
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input type="number" value={newBudget} onChange={e => setNewBudget(e.target.value)}
                        className="w-24 px-2 py-1 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none" />
                      <button onClick={saveBudget} disabled={savingBudget}
                        className="p-1 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200">
                        {savingBudget ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button onClick={() => { setEditBudget(false); setNewBudget(String(budget)); }}
                        className="p-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
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
                  <div className="h-full rounded-full transition-all"
                    style={{
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
                                <div className="h-full rounded-full"
                                  style={{ width: `${Math.min(pct, 100)}%`, background: overLimit ? "#ef4444" : "var(--accent)" }} />
                              </div>
                              <span className={clsx("text-xs font-medium", overLimit ? "text-red-500" : "text-gray-500")}>
                                {pct.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {overLimit && <AlertTriangle className="w-4 h-4 text-red-400" />}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

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
                          현재 ${req.current_used.toFixed(1)} / ${req.current_quota} 사용 · 요청 +${req.requested_amount}
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
                            className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg hover:opacity-90"
                            style={{ background: "var(--accent)" }}>승인</button>
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
        )}
      </div>
    </main>
  );
}
