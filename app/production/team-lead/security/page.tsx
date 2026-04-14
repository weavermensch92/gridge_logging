"use client";

import { useMemo } from "react";
import { Shield } from "lucide-react";
import clsx from "clsx";
import { MOCK_LOGS, MOCK_RISK_ALERTS } from "@/lib/mockData";

const MY_TEAM_NAME = "개발팀";

const SEVERITY_STYLE = {
  critical: { bg: "bg-red-100", text: "text-red-600", dot: "bg-red-500" },
  warning:  { bg: "bg-amber-100", text: "text-amber-600", dot: "bg-amber-400" },
  info:     { bg: "bg-blue-100", text: "text-blue-600", dot: "bg-blue-400" },
} as const;

export default function TeamLeadSecurity() {
  const teamLogs = useMemo(() => MOCK_LOGS.filter(l => l.team === MY_TEAM_NAME), []);
  const teamLogIds = useMemo(() => new Set(teamLogs.map(l => l.id)), [teamLogs]);
  const alerts = useMemo(() => MOCK_RISK_ALERTS.filter(a => !a.dismissed && teamLogIds.has(a.log_id)), [teamLogIds]);

  const severityCount = {
    critical: alerts.filter(a => a.severity === "critical").length,
    warning: alerts.filter(a => a.severity === "warning").length,
    info: alerts.filter(a => a.severity === "info").length,
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">위험 로그</h1>
        <p className="text-sm text-gray-500">개발팀 · 보안 규칙에 매칭된 위험 로그</p>
      </div>

      {/* 요약 */}
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

      {/* 알림 목록 */}
      <div className="glass rounded-2xl overflow-hidden">
        {alerts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-16">위험 로그가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/50 bg-white/20">
                  {["심각도", "매칭 패턴", "프롬프트", "유저", "시간"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alerts.map(alert => {
                  const log = MOCK_LOGS.find(l => l.id === alert.log_id);
                  const sev = SEVERITY_STYLE[alert.severity as keyof typeof SEVERITY_STYLE] ?? SEVERITY_STYLE.info;
                  return (
                    <tr key={alert.id} className="border-b border-white/50 hover:bg-white/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={clsx("w-2 h-2 rounded-full", sev.dot)} />
                          <span className={clsx("text-[10px] font-semibold px-2 py-0.5 rounded-full", sev.bg, sev.text)}>{alert.severity}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 font-medium">{alert.matched_pattern}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[250px]">{log?.prompt ?? "-"}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{log?.user_name ?? "-"}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(alert.timestamp).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 py-3 border-t border-white/50">
          <p className="text-xs text-gray-400">{alerts.length}건 · 보안 규칙 관리는 기업 Admin에게 문의하세요</p>
        </div>
      </div>
    </div>
  );
}
