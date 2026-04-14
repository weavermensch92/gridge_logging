"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Shield, Plus, X, ToggleLeft, ToggleRight,
  Edit3, Trash2, Loader2, Bell, Sparkles, EyeOff,
} from "lucide-react";
import clsx from "clsx";
import type { Team } from "@/types";
import { teamsApi } from "@/lib/api";
import { MOCK_RISK_RULES, MOCK_RISK_ALERTS, MOCK_LOGS } from "@/lib/mockData";
import type { RiskRule, RiskSeverity, RiskCategory, RiskAlert, RiskException } from "@/types";

const SEVERITY_STYLE: Record<RiskSeverity, { bg: string; text: string; dot: string }> = {
  critical: { bg: "bg-red-100", text: "text-red-600", dot: "bg-red-500" },
  warning:  { bg: "bg-amber-100", text: "text-amber-600", dot: "bg-amber-400" },
  info:     { bg: "bg-blue-100", text: "text-blue-600", dot: "bg-blue-400" },
};

const CATEGORY_LABEL: Record<RiskCategory, string> = {
  confidential: "기밀 정보", non_work: "비업무", security: "보안",
  compliance: "컴플라이언스", custom: "커스텀",
};

/** AI 유사 키워드 매핑 (Mock — 실제로는 LLM 호출) */
const SIMILAR_KEYWORDS: Record<string, string[]> = {
  "비밀번호": ["password", "passwd", "pwd", "secret", "credential", "인증정보"],
  "password": ["비밀번호", "passwd", "pwd", "secret", "credential"],
  "API 키": ["api_key", "apikey", "access_key", "secret_key", "api_secret", "token"],
  "api_key": ["API 키", "apikey", "access_key", "secret_key", "api_secret"],
  "토큰": ["token", "access_token", "auth_token", "jwt", "bearer"],
  "개인정보": ["주민등록번호", "전화번호", "이메일", "주소", "phone", "email", "ssn"],
  "서버": ["server", "host", "ip_address", "endpoint", "database_url", "db_url"],
  "급여": ["salary", "연봉", "월급", "보수", "임금", "wage"],
};

function getSimilarKeywords(input: string): string[] {
  const lower = input.trim().toLowerCase();
  for (const [key, values] of Object.entries(SIMILAR_KEYWORDS)) {
    if (key.toLowerCase() === lower || key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) {
      return values;
    }
  }
  return [];
}

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState<"alerts" | "rules" | "exceptions">("alerts");
  const [rules, setRules] = useState<RiskRule[]>([...MOCK_RISK_RULES]);
  const [alerts, setAlerts] = useState<RiskAlert[]>(MOCK_RISK_ALERTS.filter(a => !a.dismissed));
  const [exceptions, setExceptions] = useState<RiskException[]>([]);
  const [showAddRule, setShowAddRule] = useState(false);
  const [editingRule, setEditingRule] = useState<RiskRule | null>(null);
  const [exceptionAlert, setExceptionAlert] = useState<RiskAlert | null>(null);

  // 팀 필터
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamFilter, setTeamFilter] = useState("전체");

  const fetchTeams = useCallback(async () => {
    const res = await teamsApi.list();
    if (res.data) setTeams(res.data.teams);
  }, []);
  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  // 팀 필터 적용 (알림 탭)
  const filteredAlerts = useMemo(() => {
    if (teamFilter === "전체") return alerts;
    return alerts.filter(a => {
      const log = MOCK_LOGS.find(l => l.id === a.log_id);
      return log?.team === teamFilter;
    });
  }, [alerts, teamFilter]);

  const severityCount = {
    critical: filteredAlerts.filter(a => a.severity === "critical").length,
    warning: filteredAlerts.filter(a => a.severity === "warning").length,
    info: filteredAlerts.filter(a => a.severity === "info").length,
  };

  const toggleRule = (id: string) => setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  const deleteRule = (id: string) => { if (confirm("이 규칙을 삭제하시겠습니까?")) setRules(prev => prev.filter(r => r.id !== id)); };
  const dismissAlert = (id: string) => setAlerts(prev => prev.filter(a => a.id !== id));

  const handleSaveRule = (rule: RiskRule) => {
    if (editingRule) setRules(prev => prev.map(r => r.id === rule.id ? rule : r));
    else setRules(prev => [...prev, rule]);
    setShowAddRule(false);
    setEditingRule(null);
  };

  const handleAddException = (exc: RiskException) => {
    setExceptions(prev => [...prev, exc]);
    // 내용 기반이면 해당 패턴의 모든 알림 자동 제거
    if (exc.type === "content_based") {
      setAlerts(prev => prev.filter(a => a.matched_pattern !== exc.pattern));
    }
    setExceptionAlert(null);
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

      {/* 팀 필터 */}
      <div className="glass rounded-2xl p-3 mb-4 flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-gray-500 w-8">팀</span>
        {["전체", ...teams.map(t => t.name)].map(t => (
          <button key={t} onClick={() => setTeamFilter(t)}
            className={clsx("text-xs px-3 py-1.5 rounded-full font-medium transition-colors",
              teamFilter === t ? "text-white" : "bg-white/60 text-gray-500 hover:bg-white/80")}
            style={teamFilter === t ? { background: "var(--accent)" } : {}}>
            {t}
          </button>
        ))}
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {([
          { label: "Critical", count: severityCount.critical, style: SEVERITY_STYLE.critical },
          { label: "Warning", count: severityCount.warning, style: SEVERITY_STYLE.warning },
          { label: "Info", count: severityCount.info, style: SEVERITY_STYLE.info },
        ]).map(s => (
          <div key={s.label} className={clsx("glass rounded-2xl p-4 text-center", s.count > 0 && s.style.bg)}>
            <p className={clsx("text-2xl font-black", s.count > 0 ? s.style.text : "text-gray-900")}>{s.count}</p>
            <p className={clsx("text-xs font-medium mt-0.5", s.count > 0 ? s.style.text : "text-gray-500")}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* 탭 — 알림/규칙/예외 */}
      <div className="flex gap-1 glass rounded-xl p-1 mb-6 w-fit">
        {([
          { key: "alerts" as const, label: "알림", icon: <Bell className="w-4 h-4" />, badge: filteredAlerts.length },
          { key: "rules" as const, label: "규칙", icon: <Shield className="w-4 h-4" />, badge: rules.length },
          { key: "exceptions" as const, label: "예외", icon: <EyeOff className="w-4 h-4" />, badge: exceptions.length },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.key ? "text-white shadow-sm" : "text-gray-500 hover:bg-white/40")}
            style={activeTab === tab.key ? { background: "var(--accent)" } : {}}>
            {tab.icon}{tab.label}
            {tab.badge > 0 && (
              <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                activeTab === tab.key ? "bg-white/30 text-white" : "bg-gray-200 text-gray-500")}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══ 알림 탭 ═══ */}
      {activeTab === "alerts" && (
        <div className="glass rounded-2xl overflow-hidden">
          {filteredAlerts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-16">알림이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/50 bg-white/20">
                    {["심각도", "매칭 패턴", "프롬프트", "유저", "팀", "시간", ""].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.map(alert => {
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
                        <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[180px]">{log?.prompt ?? "-"}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{log?.user_name ?? "-"}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{log?.team ?? "-"}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(alert.timestamp).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => dismissAlert(alert.id)}
                              className="text-[10px] text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-white/60">해제</button>
                            <button onClick={() => setExceptionAlert(alert)}
                              className="text-[10px] px-2 py-1 rounded hover:bg-amber-50 text-amber-500 hover:text-amber-700 font-medium">덜 보기</button>
                          </div>
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

      {/* ═══ 규칙 탭 ═══ */}
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
                        <button onClick={() => toggleRule(rule.id)}>
                          {rule.enabled ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                        </button>
                      </td>
                      <td className="px-4 py-3"><p className="text-sm font-medium text-gray-800">{rule.name}</p><p className="text-[10px] text-gray-400">{rule.description}</p></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{CATEGORY_LABEL[rule.category]}</td>
                      <td className="px-4 py-3"><span className={clsx("text-[10px] font-semibold px-2 py-0.5 rounded-full", sev.bg, sev.text)}>{rule.severity}</span></td>
                      <td className="px-4 py-3"><span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{rule.match_field === "prompt" ? "프롬프트" : rule.match_field === "response" ? "응답" : "전체"}</span></td>
                      <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{rule.patterns.map((p, i) => <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">{p}</span>)}</div></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingRule(rule); setShowAddRule(true); }} className="p-1.5 rounded-lg hover:bg-white/60 text-gray-400 hover:text-gray-600"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteRule(rule.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
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

      {/* ═══ 예외 탭 ═══ */}
      {activeTab === "exceptions" && (
        <div className="glass rounded-2xl overflow-hidden">
          {exceptions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-16">등록된 예외가 없습니다. 알림 탭에서 &ldquo;덜 보기&rdquo;로 예외를 추가할 수 있습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/50 bg-white/20">
                    {["패턴", "유형", "조건", "사유", "등록일", ""].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {exceptions.map(exc => (
                    <tr key={exc.id} className="border-b border-white/50 hover:bg-white/20 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-gray-700">{exc.pattern}</td>
                      <td className="px-4 py-3">
                        <span className={clsx("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                          exc.type === "content_based" ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600")}>
                          {exc.type === "content_based" ? "내용 기반" : "사람 레벨"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {exc.type === "role_based" ? `${exc.role_threshold} 이상 허용` : "동일 패턴 자동 패스"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{exc.reason}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{new Date(exc.created_at).toLocaleDateString("ko-KR")}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setExceptions(prev => prev.filter(e => e.id !== exc.id))}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 규칙 추가/편집 모달 */}
      {showAddRule && <RuleModal rule={editingRule} onClose={() => { setShowAddRule(false); setEditingRule(null); }} onSave={handleSaveRule} />}

      {/* 예외 등록 모달 */}
      {exceptionAlert && <ExceptionModal alert={exceptionAlert} onClose={() => setExceptionAlert(null)} onSave={handleAddException} />}
    </div>
  );
}

/** 규칙 추가/편집 모달 — AI 유사 키워드 확장 포함 */
function RuleModal({ rule, onClose, onSave }: { rule: RiskRule | null; onClose: () => void; onSave: (r: RiskRule) => void }) {
  const isEdit = !!rule;
  const [name, setName] = useState(rule?.name ?? "");
  const [description, setDescription] = useState(rule?.description ?? "");
  const [category, setCategory] = useState<RiskCategory>(rule?.category ?? "custom");
  const [severity, setSeverity] = useState<RiskSeverity>(rule?.severity ?? "warning");
  const [matchField, setMatchField] = useState<"prompt" | "response" | "both">(rule?.match_field ?? "both");
  const [patterns, setPatterns] = useState<string[]>(rule?.patterns ?? [""]);
  const [submitting, setSubmitting] = useState(false);

  // AI 유사 키워드
  const [suggestions, setSuggestions] = useState<{ keyword: string; checked: boolean }[]>([]);
  const [lastQueried, setLastQueried] = useState("");

  const expandKeywords = (input: string) => {
    if (!input.trim() || input === lastQueried) return;
    setLastQueried(input);
    const similar = getSimilarKeywords(input);
    if (similar.length > 0) {
      setSuggestions(similar.map(k => ({ keyword: k, checked: true })));
    } else {
      setSuggestions([]);
    }
  };

  const toggleSuggestion = (idx: number) => {
    setSuggestions(prev => prev.map((s, i) => i === idx ? { ...s, checked: !s.checked } : s));
  };

  const addPattern = () => setPatterns(p => [...p, ""]);
  const removePattern = (i: number) => setPatterns(p => p.filter((_, idx) => idx !== i));
  const updatePattern = (i: number, val: string) => {
    setPatterns(p => p.map((v, idx) => idx === i ? val : v));
    if (i === 0) expandKeywords(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    let finalPatterns = patterns.filter(p => p.trim());
    // 선택된 유사 키워드를 첫 번째 패턴에 OR로 합침
    const checked = suggestions.filter(s => s.checked).map(s => s.keyword);
    if (checked.length > 0 && finalPatterns.length > 0) {
      const base = finalPatterns[0];
      finalPatterns[0] = `(${[base, ...checked].join("|")})`;
    }
    if (finalPatterns.length === 0) { setSubmitting(false); return; }
    const now = new Date().toISOString();
    onSave({ id: rule?.id ?? `rule-${Date.now()}`, name, description, category, severity, enabled: rule?.enabled ?? true, patterns: finalPatterns, match_field: matchField, created_at: rule?.created_at ?? now, updated_at: now });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-2xl p-6 w-[560px] max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2"><Shield className="w-5 h-5" style={{ color: "var(--accent)" }} /><h3 className="text-lg font-bold text-gray-800">{isEdit ? "규칙 편집" : "새 규칙 추가"}</h3></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1">규칙명</label><input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="예: 사내 IP 유출 감지" className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-200" /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">설명</label><input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="규칙 목적" className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-200" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs font-medium text-gray-500 mb-1">카테고리</label><select value={category} onChange={e => setCategory(e.target.value as RiskCategory)} className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none"><option value="confidential">기밀 정보</option><option value="security">보안</option><option value="compliance">컴플라이언스</option><option value="non_work">비업무</option><option value="custom">커스텀</option></select></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">심각도</label><select value={severity} onChange={e => setSeverity(e.target.value as RiskSeverity)} className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none"><option value="critical">Critical</option><option value="warning">Warning</option><option value="info">Info</option></select></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">감지 대상</label><select value={matchField} onChange={e => setMatchField(e.target.value as "prompt" | "response" | "both")} className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none"><option value="prompt">프롬프트</option><option value="response">응답</option><option value="both">전체</option></select></div>
          </div>

          {/* 패턴 + AI 유사 키워드 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-500">감지 패턴</label>
              <button type="button" onClick={addPattern} className="flex items-center gap-1 text-[10px] font-medium hover:underline" style={{ color: "var(--accent)" }}><Plus className="w-3 h-3" /> 패턴 추가</button>
            </div>
            <div className="space-y-2">
              {patterns.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" value={p} onChange={e => updatePattern(i, e.target.value)}
                    onBlur={e => { if (i === 0) expandKeywords(e.target.value); }}
                    placeholder="예: 비밀번호"
                    className="flex-1 px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-200 font-mono" />
                  {patterns.length > 1 && <button type="button" onClick={() => removePattern(i)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"><X className="w-4 h-4" /></button>}
                </div>
              ))}
            </div>

            {/* AI 유사 키워드 제안 */}
            {suggestions.length > 0 && (
              <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-semibold text-indigo-700">AI 유사 키워드 제안</span>
                </div>
                <p className="text-[10px] text-gray-500 mb-2">체크된 키워드가 패턴에 자동으로 OR 조건으로 추가됩니다.</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s, i) => (
                    <button key={i} type="button" onClick={() => toggleSuggestion(i)}
                      className={clsx("text-xs px-2.5 py-1 rounded-full font-mono border transition-colors",
                        s.checked ? "border-indigo-300 bg-indigo-100 text-indigo-700" : "border-gray-200 bg-white/60 text-gray-400 line-through")}>
                      {s.keyword}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/60 text-gray-600 hover:bg-white/80">취소</button>
            <button type="submit" disabled={submitting || !name || patterns.every(p => !p.trim())}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 flex items-center justify-center gap-2"
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

/** 예외 등록 모달 */
function ExceptionModal({ alert, onClose, onSave }: { alert: RiskAlert; onClose: () => void; onSave: (e: RiskException) => void }) {
  const [type, setType] = useState<"role_based" | "content_based">("content_based");
  const [roleThreshold, setRoleThreshold] = useState("team_lead");
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: `exc-${Date.now()}`,
      pattern: alert.matched_pattern,
      type,
      role_threshold: type === "role_based" ? roleThreshold : undefined,
      reason: reason || (type === "content_based" ? "업무상 문제 없음" : `${roleThreshold} 이상 허용`),
      created_by: "정우진",
      created_at: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-2xl p-6 w-[440px] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2"><EyeOff className="w-5 h-5" style={{ color: "var(--accent)" }} /><h3 className="text-lg font-bold text-gray-800">예외 등록</h3></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="mb-4 rounded-lg bg-gray-50 border border-gray-100 p-3">
          <p className="text-xs text-gray-500">매칭 패턴: <b className="text-gray-700 font-mono">{alert.matched_pattern}</b></p>
          <p className="text-xs text-gray-500 mt-1">심각도: <span className={clsx("font-semibold", SEVERITY_STYLE[alert.severity].text)}>{alert.severity}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">예외 사유를 선택하세요</p>
            <div className="space-y-2">
              <label className={clsx("flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                type === "role_based" ? "border-indigo-200 bg-indigo-50/40" : "border-gray-200 hover:bg-gray-50")}>
                <input type="radio" name="type" value="role_based" checked={type === "role_based"}
                  onChange={() => setType("role_based")} className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">사람 레벨 기반</p>
                  <p className="text-xs text-gray-400">특정 역할 이상에서 발생한 이 패턴은 예외 처리</p>
                </div>
              </label>
              <label className={clsx("flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                type === "content_based" ? "border-emerald-200 bg-emerald-50/40" : "border-gray-200 hover:bg-gray-50")}>
                <input type="radio" name="type" value="content_based" checked={type === "content_based"}
                  onChange={() => setType("content_based")} className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">내용 기반</p>
                  <p className="text-xs text-gray-400">이 내용은 업무상 문제 없음 → 동일 패턴 자동 패스</p>
                </div>
              </label>
            </div>
          </div>

          {type === "role_based" && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">허용 역할 기준</label>
              <select value={roleThreshold} onChange={e => setRoleThreshold(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none">
                <option value="team_lead">팀장(Team Lead) 이상</option>
                <option value="admin">Admin 이상</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">사유 (선택)</label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)}
              placeholder={type === "content_based" ? "예: 개발 테스트용 키워드" : "예: 팀장급은 보안 교육 이수 완료"}
              className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-200" />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/60 text-gray-600 hover:bg-white/80">취소</button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: "var(--accent)" }}>
              <EyeOff className="w-4 h-4" /> 예외 등록
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
