"use client";

import { useState } from "react";
import {
  Shield, Plus, X, ToggleLeft, ToggleRight,
  Edit3, Trash2, AlertTriangle, Loader2, Bell,
} from "lucide-react";
import clsx from "clsx";
import { MOCK_RISK_RULES, MOCK_RISK_ALERTS, MOCK_LOGS } from "@/lib/mockData";
import type { RiskRule, RiskSeverity, RiskCategory, RiskAlert } from "@/types";

const SEVERITY_STYLE: Record<RiskSeverity, { bg: string; text: string; dot: string }> = {
  critical: { bg: "bg-red-100", text: "text-red-600", dot: "bg-red-500" },
  warning:  { bg: "bg-amber-100", text: "text-amber-600", dot: "bg-amber-400" },
  info:     { bg: "bg-blue-100", text: "text-blue-600", dot: "bg-blue-400" },
};

const CATEGORY_LABEL: Record<RiskCategory, string> = {
  confidential: "기밀 정보", non_work: "비업무", security: "보안",
  compliance: "컴플라이언스", custom: "커스텀",
};

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState<"alerts" | "rules">("alerts");
  const [rules, setRules] = useState<RiskRule[]>([...MOCK_RISK_RULES]);
  const [alerts, setAlerts] = useState<RiskAlert[]>(MOCK_RISK_ALERTS.filter(a => !a.dismissed));
  const [showAddRule, setShowAddRule] = useState(false);
  const [editingRule, setEditingRule] = useState<RiskRule | null>(null);

  const severityCount = {
    critical: alerts.filter(a => a.severity === "critical").length,
    warning: alerts.filter(a => a.severity === "warning").length,
    info: alerts.filter(a => a.severity === "info").length,
  };

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteRule = (id: string) => {
    if (!confirm("이 규칙을 삭제하시겠습니까?")) return;
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleSaveRule = (rule: RiskRule) => {
    if (editingRule) {
      setRules(prev => prev.map(r => r.id === rule.id ? rule : r));
    } else {
      setRules(prev => [...prev, rule]);
    }
    setShowAddRule(false);
    setEditingRule(null);
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">보안 설정</h1>
          <p className="text-sm text-gray-500">위험 알림 모니터링 · 보안 규칙 관리</p>
        </div>
        <button onClick={() => { setEditingRule(null); setShowAddRule(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
          style={{ background: "var(--accent)" }}>
          <Plus className="w-4 h-4" /> 규칙 추가
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {([
          { label: "Critical", count: severityCount.critical, style: SEVERITY_STYLE.critical },
          { label: "Warning", count: severityCount.warning, style: SEVERITY_STYLE.warning },
          { label: "Info", count: severityCount.info, style: SEVERITY_STYLE.info },
        ]).map(s => (
          <div key={s.label} className={clsx("glass rounded-2xl p-4 text-center", s.count > 0 && `${s.style.bg}`)}>
            <p className={clsx("text-2xl font-black", s.count > 0 ? s.style.text : "text-gray-900")}>{s.count}</p>
            <p className={clsx("text-xs font-medium mt-0.5", s.count > 0 ? s.style.text : "text-gray-500")}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* 탭 — 알림 먼저 */}
      <div className="flex gap-1 glass rounded-xl p-1 mb-6 w-fit">
        <button onClick={() => setActiveTab("alerts")}
          className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "alerts" ? "text-white shadow-sm" : "text-gray-500 hover:bg-white/40")}
          style={activeTab === "alerts" ? { background: "var(--accent)" } : {}}>
          <Bell className="w-4 h-4" />
          알림 ({alerts.length})
          {severityCount.critical > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold">{severityCount.critical}</span>
          )}
        </button>
        <button onClick={() => setActiveTab("rules")}
          className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "rules" ? "text-white shadow-sm" : "text-gray-500 hover:bg-white/40")}
          style={activeTab === "rules" ? { background: "var(--accent)" } : {}}>
          <Shield className="w-4 h-4" />
          규칙 ({rules.length})
        </button>
      </div>

      {/* 알림 탭 */}
      {activeTab === "alerts" && (
        <div className="glass rounded-2xl overflow-hidden">
          {alerts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-16">알림이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/50 bg-white/20">
                    {["심각도", "매칭 패턴", "프롬프트 미리보기", "유저", "시간", ""].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alerts.map(alert => {
                    const log = MOCK_LOGS.find(l => l.id === alert.log_id);
                    const sev = SEVERITY_STYLE[alert.severity];
                    return (
                      <tr key={alert.id} className="border-b border-white/50 hover:bg-white/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={clsx("w-2 h-2 rounded-full", sev.dot)} />
                            <span className={clsx("text-[10px] font-semibold px-2 py-0.5 rounded-full", sev.bg, sev.text)}>{alert.severity}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700 font-medium">{alert.matched_pattern}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[220px]">{log?.prompt ?? "-"}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{log?.user_name ?? "-"}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(alert.timestamp).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => dismissAlert(alert.id)}
                            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-white/60 transition-colors">
                            해제
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 규칙 탭 */}
      {activeTab === "rules" && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/50 bg-white/20">
                  {["활성", "규칙명", "카테고리", "심각도", "감지 대상", "패턴", ""].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rules.map(rule => {
                  const sev = SEVERITY_STYLE[rule.severity];
                  return (
                    <tr key={rule.id} className={clsx("border-b border-white/50 hover:bg-white/20 transition-colors", !rule.enabled && "opacity-50")}>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleRule(rule.id)} className="flex-shrink-0">
                          {rule.enabled
                            ? <ToggleRight className="w-6 h-6 text-green-500" />
                            : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{rule.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{rule.description}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">{CATEGORY_LABEL[rule.category]}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx("text-[10px] font-semibold px-2 py-0.5 rounded-full", sev.bg, sev.text)}>{rule.severity}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                          {rule.match_field === "prompt" ? "프롬프트" : rule.match_field === "response" ? "응답" : "전체"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {rule.patterns.map((p, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">{p}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingRule(rule); setShowAddRule(true); }}
                            className="p-1.5 rounded-lg hover:bg-white/60 text-gray-400 hover:text-gray-600 transition-colors">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteRule(rule.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-white/50 flex items-center justify-between">
            <p className="text-xs text-gray-400">{rules.length}개 규칙 · {rules.filter(r => r.enabled).length}개 활성</p>
            <button onClick={() => { setEditingRule(null); setShowAddRule(true); }}
              className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: "var(--accent)" }}>
              <Plus className="w-3 h-3" /> 규칙 추가
            </button>
          </div>
        </div>
      )}

      {/* 규칙 추가/편집 모달 */}
      {showAddRule && (
        <RuleModal
          rule={editingRule}
          onClose={() => { setShowAddRule(false); setEditingRule(null); }}
          onSave={handleSaveRule}
        />
      )}
    </div>
  );
}

function RuleModal({ rule, onClose, onSave }: {
  rule: RiskRule | null;
  onClose: () => void;
  onSave: (rule: RiskRule) => void;
}) {
  const isEdit = !!rule;
  const [name, setName] = useState(rule?.name ?? "");
  const [description, setDescription] = useState(rule?.description ?? "");
  const [category, setCategory] = useState<RiskCategory>(rule?.category ?? "custom");
  const [severity, setSeverity] = useState<RiskSeverity>(rule?.severity ?? "warning");
  const [matchField, setMatchField] = useState<"prompt" | "response" | "both">(rule?.match_field ?? "both");
  const [patterns, setPatterns] = useState<string[]>(rule?.patterns ?? [""]);
  const [submitting, setSubmitting] = useState(false);

  const addPattern = () => setPatterns(p => [...p, ""]);
  const removePattern = (i: number) => setPatterns(p => p.filter((_, idx) => idx !== i));
  const updatePattern = (i: number, val: string) => setPatterns(p => p.map((v, idx) => idx === i ? val : v));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const validPatterns = patterns.filter(p => p.trim());
    if (validPatterns.length === 0) { setSubmitting(false); return; }

    const now = new Date().toISOString();
    onSave({
      id: rule?.id ?? `rule-${Date.now()}`,
      name, description, category, severity,
      enabled: rule?.enabled ?? true,
      patterns: validPatterns,
      match_field: matchField,
      created_at: rule?.created_at ?? now,
      updated_at: now,
    });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-2xl p-6 w-[560px] max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" style={{ color: "var(--accent)" }} />
            <h3 className="text-lg font-bold text-gray-800">{isEdit ? "규칙 편집" : "새 규칙 추가"}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">규칙명</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              placeholder="예: 사내 IP 유출 감지"
              className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-200" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">설명</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="이 규칙의 목적을 간략히 설명"
              className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-200" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">카테고리</label>
              <select value={category} onChange={e => setCategory(e.target.value as RiskCategory)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none focus:ring-2 focus:ring-blue-200">
                <option value="confidential">기밀 정보</option>
                <option value="security">보안</option>
                <option value="compliance">컴플라이언스</option>
                <option value="non_work">비업무</option>
                <option value="custom">커스텀</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">심각도</label>
              <select value={severity} onChange={e => setSeverity(e.target.value as RiskSeverity)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none focus:ring-2 focus:ring-blue-200">
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">감지 대상</label>
              <select value={matchField} onChange={e => setMatchField(e.target.value as "prompt" | "response" | "both")}
                className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none focus:ring-2 focus:ring-blue-200">
                <option value="prompt">프롬프트</option>
                <option value="response">응답</option>
                <option value="both">전체 (프롬프트+응답)</option>
              </select>
            </div>
          </div>

          {/* 패턴 목록 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-500">감지 패턴 (정규식)</label>
              <button type="button" onClick={addPattern}
                className="flex items-center gap-1 text-[10px] font-medium hover:underline" style={{ color: "var(--accent)" }}>
                <Plus className="w-3 h-3" /> 패턴 추가
              </button>
            </div>
            <div className="space-y-2">
              {patterns.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" value={p} onChange={e => updatePattern(i, e.target.value)}
                    placeholder="예: (비밀번호|password|secret)"
                    className="flex-1 px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-200 font-mono" />
                  {patterns.length > 1 && (
                    <button type="button" onClick={() => removePattern(i)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">정규식 패턴을 사용합니다. 여러 패턴 중 하나라도 매칭되면 알림이 발생합니다.</p>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/60 text-gray-600 hover:bg-white/80 transition-colors">
              취소
            </button>
            <button type="submit" disabled={submitting || !name || patterns.every(p => !p.trim())}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: "var(--accent)" }}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {isEdit ? "저장" : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
