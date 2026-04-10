"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity, Building2, Plus, X, Users, Cpu,
  Loader2, UserCheck, Trash2, ChevronRight,
  FileText, Database,
} from "lucide-react";
import type { Organization } from "@/types";
import { orgApi } from "@/lib/api";

/** 그릿지 플랫폼 운영 비용 (로그 수집/분석용) */
const MOCK_PLATFORM_COST = {
  total_usd: 87.4,
  breakdown: [
    { label: "코칭 리포트 생성 (LLM)", usd: 52.1 },
    { label: "보안 스캔 분석", usd: 18.6 },
    { label: "로그 수집/저장", usd: 16.7 },
  ],
  total_logs_processed: 12_840,
  this_month_reports: 23,
};

export default function SuperAdminPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [assignOrg, setAssignOrg] = useState<Organization | null>(null);

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    const res = await orgApi.listOrgs();
    if (res.data) setOrgs(res.data.orgs);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  const deleteOrg = async (org: Organization) => {
    if (!confirm(`"${org.name}" 기업을 삭제하시겠습니까?`)) return;
    await orgApi.deleteOrg(org.id);
    fetchOrgs();
  };

  const totalUsers = orgs.reduce((s, o) => s + (o.user_count ?? 0), 0);
  const platform = MOCK_PLATFORM_COST;

  return (
    <main className="min-h-screen p-6" style={{ background: "var(--bg-base)" }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
          style={{ background: "var(--accent)" }} />
      </div>

      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: "var(--accent)" }}>
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gridge 플랫폼 관리</h1>
              <p className="text-sm text-gray-500">기업 생성 · Admin 지정 · 운영 현황</p>
            </div>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
            style={{ background: "var(--accent)" }}>
            <Plus className="w-4 h-4" /> 기업 추가
          </button>
        </div>

        {/* 플랫폼 운영 현황 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">등록 기업</span>
            </div>
            <p className="text-3xl font-black text-gray-900">{orgs.length}<span className="text-sm font-normal text-gray-400 ml-1">개</span></p>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">전체 유저</span>
            </div>
            <p className="text-3xl font-black text-gray-900">{totalUsers}<span className="text-sm font-normal text-gray-400 ml-1">명</span></p>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">그릿지 운영 비용</span>
            </div>
            <p className="text-3xl font-black text-gray-900">${platform.total_usd}<span className="text-sm font-normal text-gray-400 ml-1">이번달</span></p>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">처리된 로그</span>
            </div>
            <p className="text-3xl font-black text-gray-900">{platform.total_logs_processed.toLocaleString()}<span className="text-sm font-normal text-gray-400 ml-1">건</span></p>
          </div>
        </div>

        {/* 그릿지 운영 비용 상세 */}
        <div className="glass rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">운영 비용 내역 (로그 수집 · 분석 · 코칭)</h2>
          </div>
          <div className="space-y-3">
            {platform.breakdown.map((item, i) => {
              const pct = (item.usd / platform.total_usd) * 100;
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium">{item.label}</span>
                    <span className="text-gray-500">${item.usd.toFixed(1)} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--accent)" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-white/50 flex items-center gap-4 text-xs text-gray-400">
            <span>코칭 리포트 생성 {platform.this_month_reports}건</span>
            <span>·</span>
            <span>로그 처리 {platform.total_logs_processed.toLocaleString()}건</span>
          </div>
        </div>

        {/* 기업 카드 그리드 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">등록 기업 목록</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orgs.map(org => (
                <div key={org.id} className="glass rounded-2xl p-6 hover:shadow-lg transition-shadow group">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{org.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {org.created_at ? new Date(org.created_at).toLocaleDateString("ko-KR") + " 등록" : ""}
                      </p>
                    </div>
                    <button onClick={() => deleteOrg(org)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Admin */}
                  <div className="flex items-center gap-2 mb-4">
                    <UserCheck className="w-4 h-4 text-gray-400" />
                    {org.admin_name ? (
                      <span className="text-sm text-gray-700 font-medium">{org.admin_name}</span>
                    ) : (
                      <button onClick={() => setAssignOrg(org)}
                        className="text-sm font-medium hover:underline" style={{ color: "var(--accent)" }}>
                        Admin 지정 필요
                      </button>
                    )}
                    {org.admin_name && (
                      <button onClick={() => setAssignOrg(org)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 hover:bg-gray-200 ml-auto">변경</button>
                    )}
                  </div>

                  {/* 기업 규모 */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-2 rounded-lg bg-white/40">
                      <p className="text-lg font-bold text-gray-800">{org.user_count ?? 0}</p>
                      <p className="text-[10px] text-gray-400">유저</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-white/40">
                      <p className="text-lg font-bold text-gray-800">{org.team_count ?? 0}</p>
                      <p className="text-[10px] text-gray-400">팀</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-white/40">
                      <p className="text-lg font-bold text-gray-800">
                        <FileText className="w-4 h-4 inline text-gray-400" />
                      </p>
                      <p className="text-[10px] text-gray-400">{org.billing_cycle === "monthly" ? "월간" : "분기"}</p>
                    </div>
                  </div>

                  <button className="w-full mt-2 flex items-center justify-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 py-2 rounded-lg hover:bg-white/40 transition-colors">
                    상세 보기 <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* 기업 추가 카드 */}
              <button onClick={() => setShowAddModal(true)}
                className="glass rounded-2xl p-6 border-2 border-dashed border-gray-200 hover:border-gray-300 flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-gray-600 transition-colors min-h-[260px]">
                <Plus className="w-8 h-8" />
                <span className="text-sm font-medium">새 기업 추가</span>
              </button>
            </div>
          </>
        )}
      </div>

      {showAddModal && <AddOrgModal onClose={() => setShowAddModal(false)} onSuccess={fetchOrgs} />}
      {assignOrg && <AssignAdminModal org={assignOrg} onClose={() => setAssignOrg(null)} onSuccess={fetchOrgs} />}
    </main>
  );
}

function AddOrgModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("500");
  const [cycle, setCycle] = useState<"monthly" | "quarterly">("monthly");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await orgApi.createOrg({ name, ai_budget_usd: Number(budget), billing_cycle: cycle });
    setSubmitting(false);
    onSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-2xl p-6 w-[440px] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5" style={{ color: "var(--accent)" }} />
            <h3 className="text-lg font-bold text-gray-800">새 기업 추가</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">기업명</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              placeholder="예: ABC Corporation"
              className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">고객 AI 예산 (USD)</label>
              <input type="number" value={budget} onChange={e => setBudget(e.target.value)} min="0" step="100"
                className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">결제 주기</label>
              <select value={cycle} onChange={e => setCycle(e.target.value as "monthly" | "quarterly")}
                className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none focus:ring-2 focus:ring-blue-200">
                <option value="monthly">월간</option>
                <option value="quarterly">분기</option>
              </select>
            </div>
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

function AssignAdminModal({ org, onClose, onSuccess }: { org: Organization; onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await orgApi.assignAdmin(org.id, { admin_email: email });
    setSubmitting(false);
    onSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-2xl p-6 w-[420px] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" style={{ color: "var(--accent)" }} />
            <h3 className="text-lg font-bold text-gray-800">{org.name} Admin 지정</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Admin 이메일</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="admin@company.com"
              className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-200" />
            <p className="text-[10px] text-gray-400 mt-1">해당 이메일의 유저가 이 기업의 관리자(Admin)로 지정됩니다.</p>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/60 text-gray-600 hover:bg-white/80 transition-colors">취소</button>
            <button type="submit" disabled={submitting || !email}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: "var(--accent)" }}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              지정
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
