"use client";

import { useState, useMemo } from "react";
import {
  AlertTriangle, CheckCircle2, Shield, X,
  ToggleLeft, ToggleRight, XCircle,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import clsx from "clsx";
import type { RiskRule, RiskSeverity, RiskCategory } from "@/types";
import {
  MOCK_LOGS, MOCK_RISK_RULES, MOCK_RISK_ALERTS,
} from "@/lib/mockData";

function StatCard({
  icon, label, value, sub,
}: {
  icon: React.ReactNode; label: string; value: string; sub?: string;
}) {
  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

const SEVERITY_STYLE: Record<RiskSeverity, { color: string; bg: string; label: string }> = {
  critical: { color: "#ef4444", bg: "#fef2f2", label: "위험" },
  warning:  { color: "#f59e0b", bg: "#fffbeb", label: "주의" },
  info:     { color: "#3b82f6", bg: "#eff6ff", label: "참고" },
};

const CATEGORY_STYLE: Record<RiskCategory, { color: string; bg: string; label: string }> = {
  confidential: { color: "#ef4444", bg: "#fef2f2", label: "기밀 정보" },
  non_work:     { color: "#3b82f6", bg: "#eff6ff", label: "업무 외" },
  security:     { color: "#7c3aed", bg: "#f5f3ff", label: "보안" },
  compliance:   { color: "#f59e0b", bg: "#fffbeb", label: "컴플라이언스" },
  custom:       { color: "#6b7280", bg: "#f9fafb", label: "커스텀" },
};

export default function SecurityTab() {
  const [secTab, setSecTab] = useState<"rules" | "dashboard">("rules");
  const [rules, setRules] = useState(MOCK_RISK_RULES);
  const [selectedRule, setSelectedRule] = useState<RiskRule | null>(null);
  const [alerts, setAlerts] = useState(MOCK_RISK_ALERTS);

  const toggleRule = (id: string) => {
    setRules(rs => rs.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const dismissAlert = (id: string) => {
    setAlerts(as => as.map(a => a.id === id ? { ...a, dismissed: true } : a));
  };

  const previewMatches = useMemo(() => {
    if (!selectedRule) return [];
    return MOCK_LOGS.filter(log => {
      const text = selectedRule.match_field === "both"
        ? `${log.prompt} ${log.response}`
        : log[selectedRule.match_field];
      return selectedRule.patterns.some(p => text.toLowerCase().includes(p.toLowerCase()));
    }).slice(0, 5);
  }, [selectedRule]);

  const activeAlerts = alerts.filter(a => !a.dismissed);
  const criticalCount = activeAlerts.filter(a => a.severity === "critical").length;
  const warningCount = activeAlerts.filter(a => a.severity === "warning").length;
  const infoCount = activeAlerts.filter(a => a.severity === "info").length;
  const enabledRulesCount = rules.filter(r => r.enabled).length;

  const sevPieData = [
    { name: "위험", value: criticalCount, color: "#ef4444" },
    { name: "주의", value: warningCount, color: "#f59e0b" },
    { name: "참고", value: infoCount, color: "#3b82f6" },
  ].filter(d => d.value > 0);

  return (
    <div>
      <div className="flex gap-1 glass rounded-xl p-1 mb-6 w-fit">
        {([
          { key: "rules" as const, label: "보안 규칙" },
          { key: "dashboard" as const, label: "감지 현황" },
        ]).map(t => (
          <button key={t.key} onClick={() => setSecTab(t.key)}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              secTab === t.key ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-white/40",
            )}
            style={secTab === t.key ? { background: "#ef4444" } : {}}
          >
            {t.label}
          </button>
        ))}
      </div>

      {secTab === "rules" && (
        <div className="space-y-3">
          {rules.map(rule => {
            const cat = CATEGORY_STYLE[rule.category];
            const sev = SEVERITY_STYLE[rule.severity];
            return (
              <div key={rule.id}
                className={clsx("glass rounded-2xl p-4 transition-all cursor-pointer hover:shadow-md", !rule.enabled && "opacity-50")}
                onClick={() => setSelectedRule(rule)}
              >
                <div className="flex items-center gap-3">
                  <button onClick={(e) => { e.stopPropagation(); toggleRule(rule.id); }}
                    className="flex-shrink-0">
                    {rule.enabled
                      ? <ToggleRight className="w-6 h-6 text-green-500" />
                      : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-gray-800">{rule.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: cat.bg, color: cat.color }}>
                        {cat.label}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: sev.bg, color: sev.color }}>
                        {sev.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{rule.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-gray-400">{rule.patterns.length}개 패턴</div>
                    <div className="text-[10px] text-gray-300">{rule.match_field === "both" ? "전체" : rule.match_field}</div>
                  </div>
                </div>
              </div>
            );
          })}

          {selectedRule && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
              onClick={() => setSelectedRule(null)}>
              <div className="glass rounded-2xl p-6 w-[600px] max-h-[80vh] overflow-y-auto shadow-2xl"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{selectedRule.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{selectedRule.description}</p>
                  </div>
                  <button onClick={() => setSelectedRule(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex gap-2 mb-4">
                  <span className="text-xs px-2 py-1 rounded-lg" style={{ background: CATEGORY_STYLE[selectedRule.category].bg, color: CATEGORY_STYLE[selectedRule.category].color }}>
                    {CATEGORY_STYLE[selectedRule.category].label}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-lg" style={{ background: SEVERITY_STYLE[selectedRule.severity].bg, color: SEVERITY_STYLE[selectedRule.severity].color }}>
                    {SEVERITY_STYLE[selectedRule.severity].label}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600">
                    검사 대상: {selectedRule.match_field === "both" ? "프롬프트 + 응답" : selectedRule.match_field}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">감지 패턴</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRule.patterns.map(p => (
                      <span key={p} className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">{p}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                    매칭 미리보기 ({previewMatches.length}건)
                  </p>
                  {previewMatches.length === 0 ? (
                    <p className="text-xs text-gray-400 py-4 text-center">매칭되는 로그가 없습니다.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {previewMatches.map(log => (
                        <div key={log.id} className="bg-white/50 rounded-lg p-2 text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-700">{log.user_name}</span>
                            <span className="text-gray-400">{new Date(log.timestamp).toLocaleDateString("ko-KR")}</span>
                          </div>
                          <p className="text-gray-600 truncate">{log.prompt}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {secTab === "dashboard" && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <StatCard icon={<AlertTriangle className="w-4 h-4" />} label="플래그 로그" value={`${activeAlerts.length}건`} />
            <StatCard icon={<XCircle className="w-4 h-4" />} label="위험(Critical)" value={`${criticalCount}건`} sub="즉시 조치 필요" />
            <StatCard icon={<AlertTriangle className="w-4 h-4" />} label="주의(Warning)" value={`${warningCount}건`} />
            <StatCard icon={<Shield className="w-4 h-4" />} label="활성 규칙" value={`${enabledRulesCount}개`} sub={`전체 ${rules.length}개`} />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="glass rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-3">심각도 분포</p>
              {sevPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={sevPieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                      innerRadius={35} outerRadius={60} paddingAngle={4}>
                      {sevPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}건`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-gray-400 py-12 text-center">알림 없음</p>
              )}
              <div className="space-y-1 mt-2">
                {sevPieData.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-gray-600">{d.name}</span>
                    <span className="ml-auto font-semibold text-gray-800">{d.value}건</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-3 glass rounded-2xl p-4 overflow-x-auto">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-3">플래그 로그</p>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200/50 text-xs text-gray-400 uppercase">
                    <th className="px-3 py-2">심각도</th>
                    <th className="px-3 py-2">규칙</th>
                    <th className="px-3 py-2">유저</th>
                    <th className="px-3 py-2">매칭 패턴</th>
                    <th className="px-3 py-2">매칭 내용</th>
                    <th className="px-3 py-2">시간</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {activeAlerts.map(a => {
                    const rule = MOCK_RISK_RULES.find(r => r.id === a.rule_id);
                    const log = MOCK_LOGS.find(l => l.id === a.log_id);
                    const sev = SEVERITY_STYLE[a.severity];
                    return (
                      <tr key={a.id} className="border-b border-white/40 hover:bg-white/20 transition-colors">
                        <td className="px-3 py-2">
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: sev.bg, color: sev.color }}>{sev.label}</span>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-700 font-medium">{rule?.name ?? "-"}</td>
                        <td className="px-3 py-2 text-xs text-gray-600">{log?.user_name ?? "-"}</td>
                        <td className="px-3 py-2">
                          <span className="font-mono text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{a.matched_pattern}</span>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500 max-w-xs truncate">{a.matched_text_preview}</td>
                        <td className="px-3 py-2 text-[10px] text-gray-400 whitespace-nowrap">
                          {new Date(a.timestamp).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={() => dismissAlert(a.id)}
                            className="text-[10px] text-gray-400 hover:text-red-500 transition-colors">해제</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {activeAlerts.length === 0 && (
                <div className="py-8 text-center text-sm text-gray-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  모든 알림이 해제되었습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
