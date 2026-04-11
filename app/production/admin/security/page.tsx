"use client";

import { useState } from "react";
import { Shield, AlertTriangle, ToggleLeft, ToggleRight } from "lucide-react";
import clsx from "clsx";
import { MOCK_RISK_RULES, MOCK_RISK_ALERTS } from "@/lib/mockData";

export default function SecurityPage() {
  const [showRules, setShowRules] = useState(true);
  const alerts = MOCK_RISK_ALERTS.filter(a => !a.dismissed);
  const rules = MOCK_RISK_RULES;

  const severityCount = {
    critical: alerts.filter(a => a.severity === "critical").length,
    warning: alerts.filter(a => a.severity === "warning").length,
    info: alerts.filter(a => a.severity === "info").length,
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">보안 설정</h1>
        <p className="text-sm text-gray-500">보안 규칙 관리 · 위험 알림 모니터링</p>
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {([
          { label: "Critical", count: severityCount.critical, color: "text-red-600 bg-red-50" },
          { label: "Warning", count: severityCount.warning, color: "text-amber-600 bg-amber-50" },
          { label: "Info", count: severityCount.info, color: "text-blue-600 bg-blue-50" },
        ] as const).map(s => (
          <div key={s.label} className={clsx("glass rounded-2xl p-4 text-center", s.count > 0 && s.color)}>
            <p className="text-2xl font-black">{s.count}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 탭 */}
      <div className="flex gap-1 glass rounded-xl p-1 mb-6 w-fit">
        <button onClick={() => setShowRules(true)}
          className={clsx("px-4 py-2 rounded-lg text-sm font-medium transition-all",
            showRules ? "text-white" : "text-gray-500 hover:bg-white/40")}
          style={showRules ? { background: "var(--accent)" } : {}}>
          규칙 ({rules.length})
        </button>
        <button onClick={() => setShowRules(false)}
          className={clsx("px-4 py-2 rounded-lg text-sm font-medium transition-all",
            !showRules ? "text-white" : "text-gray-500 hover:bg-white/40")}
          style={!showRules ? { background: "var(--accent)" } : {}}>
          알림 ({alerts.length})
        </button>
      </div>

      {showRules ? (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/50 bg-white/20">
                {["규칙명", "카테고리", "심각도", "상태", "패턴"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map(rule => (
                <tr key={rule.id} className="border-b border-white/50 hover:bg-white/20 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{rule.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{rule.category}</td>
                  <td className="px-4 py-3">
                    <span className={clsx("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      rule.severity === "critical" ? "bg-red-100 text-red-600" :
                      rule.severity === "warning" ? "bg-amber-100 text-amber-600" :
                      "bg-amber-100 text-amber-600")}>{rule.severity}</span>
                  </td>
                  <td className="px-4 py-3">
                    {rule.enabled
                      ? <ToggleRight className="w-5 h-5 text-green-500" />
                      : <ToggleLeft className="w-5 h-5 text-gray-300" />}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono truncate max-w-[200px]">
                    {rule.patterns.join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/50 bg-white/20">
                {["심각도", "매칭 패턴", "규칙", "로그 ID"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alerts.map(alert => (
                <tr key={alert.id} className="border-b border-white/50 hover:bg-white/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={clsx("w-2 h-2 rounded-full",
                        alert.severity === "critical" ? "bg-red-500" :
                        alert.severity === "warning" ? "bg-amber-400" : "bg-blue-400")} />
                      <span className="text-xs font-medium text-gray-700">{alert.severity}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{alert.matched_pattern}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{alert.rule_id}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">{alert.log_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
