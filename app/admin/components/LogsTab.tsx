"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Activity, DollarSign, Users, Clock,
  ChevronDown, ChevronUp, Search, Filter, Calendar, X,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ChevronRight as ChevronRightIcon,
  Bot, Terminal, FileCode, Edit3, Search as SearchIcon, Globe,
} from "lucide-react";
import clsx from "clsx";
import type { Log, RiskSeverity, RiskAlert } from "@/types";
import {
  MOCK_LOGS, MOCK_TEAMS, MOCK_RISK_ALERTS,
} from "@/lib/mockData";

const CHANNEL_COLORS: Record<string, string> = {
  anthropic: "bg-orange-100 text-orange-700",
  openai:    "bg-green-100 text-green-700",
  gemini:    "bg-blue-100 text-blue-700",
  extension: "bg-purple-100 text-purple-700",
  crawler:   "bg-gray-100 text-gray-600",
};

const PAGE_SIZE = 20;

const DATE_PRESETS = [
  { label: "오늘",    days: 0 },
  { label: "최근 7일", days: 7 },
  { label: "최근 14일", days: 14 },
  { label: "최근 30일", days: 30 },
];

function toDateString(d: Date) {
  return d.toISOString().slice(0, 10);
}

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

const isAgentLog = (log: Log) => log.mode === "agent" && !!log.agent_detail;

const PHASE_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  plan:     { color: "#3b82f6", bg: "#eff6ff", label: "Plan" },
  execute:  { color: "#7c3aed", bg: "#f5f3ff", label: "Execute" },
  verify:   { color: "#10b981", bg: "#ecfdf5", label: "Verify" },
  iterate:  { color: "#f59e0b", bg: "#fffbeb", label: "Iterate" },
};

const TOOL_ICON: Record<string, React.ReactNode> = {
  bash: <Terminal className="w-3 h-3" />,
  file_read: <FileCode className="w-3 h-3" />,
  file_write: <FileCode className="w-3 h-3" />,
  edit: <Edit3 className="w-3 h-3" />,
  grep: <SearchIcon className="w-3 h-3" />,
  glob: <SearchIcon className="w-3 h-3" />,
  web_search: <Globe className="w-3 h-3" />,
};

const FILE_ACTION_STYLE: Record<string, { color: string; label: string }> = {
  created:  { color: "#10b981", label: "+" },
  modified: { color: "#3b82f6", label: "~" },
  deleted:  { color: "#ef4444", label: "-" },
};

const alertsMap = new Map<string, RiskAlert[]>();
MOCK_RISK_ALERTS.forEach(a => {
  if (!alertsMap.has(a.log_id)) alertsMap.set(a.log_id, []);
  alertsMap.get(a.log_id)!.push(a);
});

const SEVERITY_STYLE: Record<RiskSeverity, { color: string; bg: string; label: string }> = {
  critical: { color: "#ef4444", bg: "#fef2f2", label: "위험" },
  warning:  { color: "#f59e0b", bg: "#fffbeb", label: "주의" },
  info:     { color: "#3b82f6", bg: "#eff6ff", label: "참고" },
};

function AgentBriefModal({ log, onClose }: { log: Log; onClose: () => void }) {
  const d = log.agent_detail!;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}>
      <div className="glass rounded-2xl p-6 w-[680px] max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-violet-600" />
            <div>
              <h3 className="text-base font-bold text-gray-800">에이전트 기획 요약</h3>
              <p className="text-xs text-gray-400">{log.user_name} · {new Date(log.timestamp).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-[10px] font-bold text-violet-600">Q</div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">초기 요청 프롬프트</p>
          </div>
          <div className="bg-violet-50/60 rounded-xl p-3 text-sm text-gray-700 leading-relaxed border border-violet-100">
            {log.prompt}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-600">R</div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">구현 결과 요약</p>
          </div>
          <div className="bg-emerald-50/60 rounded-xl p-3 text-sm text-gray-700 leading-relaxed border border-emerald-100">
            {d.summary}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">단계별 실행 흐름</p>
          <div className="flex items-center gap-1 flex-wrap">
            {d.steps.map((step, i) => {
              const ps = PHASE_STYLE[step.phase];
              return (
                <div key={step.step} className="flex items-center gap-1">
                  <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: ps.bg, color: ps.color }}>
                    {step.step}. {step.description}
                  </span>
                  {i < d.steps.length - 1 && <ChevronRightIcon className="w-3 h-3 text-gray-300 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            파일 변경 내역 ({d.files_changed.length}개)
          </p>
          <div className="bg-white/50 rounded-xl p-3 space-y-1.5">
            {d.files_changed.map(fc => {
              const as = FILE_ACTION_STYLE[fc.action];
              const actionLabel = fc.action === "created" ? "생성" : fc.action === "modified" ? "수정" : "삭제";
              return (
                <div key={fc.path} className="flex items-center gap-2 text-xs">
                  <span className="font-bold w-8 text-center text-[10px] px-1 py-0.5 rounded"
                    style={{ background: `${as.color}18`, color: as.color }}>{actionLabel}</span>
                  <span className="font-mono text-gray-600 flex-1 truncate">{fc.path}</span>
                  <span className="text-[10px] px-1 py-0.5 rounded bg-gray-100 text-gray-500">{fc.language}</span>
                  <span className="text-green-600 text-[10px]">+{fc.additions}</span>
                  {fc.deletions > 0 && <span className="text-red-400 text-[10px]">-{fc.deletions}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function LogRow({ log, onShowBrief }: { log: Log; onShowBrief?: (log: Log) => void }) {
  const [open, setOpen] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [showCode, setShowCode] = useState(false);

  const agent = isAgentLog(log);
  const logAlerts = alertsMap.get(log.id) ?? [];
  const hasAlerts = logAlerts.length > 0;

  const toggleStep = (step: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      next.has(step) ? next.delete(step) : next.add(step);
      return next;
    });
  };

  return (
    <>
      <tr
        className={clsx(
          "border-b border-white/50 hover:bg-white/30 transition-colors cursor-pointer",
          open && "bg-white/20",
          hasAlerts && "border-l-2 border-l-red-300",
        )}
        onClick={() => setOpen(v => !v)}
      >
        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap font-medium">{log.user_name}</td>
        <td className="px-4 py-3 text-xs text-gray-500">{log.team}</td>
        <td className="px-4 py-3">
          <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full", CHANNEL_COLORS[log.channel] ?? "bg-gray-100")}>
            {log.channel}
          </span>
        </td>
        <td className="px-4 py-3 text-xs text-gray-600 font-mono">
          <div className="flex items-center gap-1">
            {agent && <Bot className="w-3 h-3 text-violet-500" />}
            {log.model}
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
          <div className="flex items-center gap-1">
            {hasAlerts && (
              <span className="flex-shrink-0 text-[10px] font-semibold px-1 py-0.5 rounded"
                style={{ background: SEVERITY_STYLE[logAlerts[0].severity].bg, color: SEVERITY_STYLE[logAlerts[0].severity].color }}>
                {SEVERITY_STYLE[logAlerts[0].severity].label}
              </span>
            )}
            <span className="truncate">{log.prompt}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{log.input_tokens.toLocaleString()} / {log.output_tokens.toLocaleString()}</td>
        <td className="px-4 py-3 text-xs font-semibold text-gray-700">${log.cost_usd.toFixed(2)}</td>
        <td className="px-4 py-3 text-xs text-gray-500">{log.latency_ms.toLocaleString()}ms</td>
        <td className="px-4 py-3 text-[10px] text-gray-400 whitespace-nowrap">
          {new Date(log.timestamp).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
        </td>
        <td className="px-4 py-3 text-gray-400">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </td>
      </tr>

      {open && (
        <tr className="bg-white/10">
          <td colSpan={10} className="px-6 py-4">
            {hasAlerts && (
              <div className="mb-3 space-y-1">
                {logAlerts.map(a => {
                  const sev = SEVERITY_STYLE[a.severity];
                  return (
                    <div key={a.id} className="flex items-center gap-2 text-xs rounded-lg px-3 py-1.5"
                      style={{ background: sev.bg }}>
                      <span className="font-semibold" style={{ color: sev.color }}>{sev.label}</span>
                      <span className="font-mono text-gray-500">{a.matched_pattern}</span>
                      <span className="text-gray-500 truncate flex-1">{a.matched_text_preview}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">프롬프트</p>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{log.prompt}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">응답</p>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{log.response}</p>
              </div>
            </div>

            {agent && log.agent_detail && (
              <div className="mt-4 border-t border-gray-200/50 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-violet-500" />
                    <span className="text-xs font-semibold text-violet-700 uppercase tracking-wider">Agent Session</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400">
                    <span>{log.agent_detail.total_steps} steps</span>
                    <span>{log.agent_detail.total_tool_calls} tool calls</span>
                    <span>{(log.agent_detail.session_duration_ms / 1000).toFixed(0)}s</span>
                    {onShowBrief && (
                      <button
                        onClick={e => { e.stopPropagation(); onShowBrief(log); }}
                        className="text-violet-500 hover:text-violet-700 font-semibold underline underline-offset-2"
                      >
                        요약 보기
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {log.agent_detail.steps.map(step => {
                    const ps = PHASE_STYLE[step.phase];
                    const expanded = expandedSteps.has(step.step);
                    return (
                      <div key={step.step} className="rounded-xl border border-gray-200/60 overflow-hidden">
                        <div
                          className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/30 transition-colors"
                          onClick={e => { e.stopPropagation(); toggleStep(step.step); }}
                        >
                          <span className="text-xs font-bold w-5 h-5 rounded-md flex items-center justify-center"
                            style={{ background: ps.bg, color: ps.color }}>{step.step}</span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ background: ps.bg, color: ps.color }}>{ps.label}</span>
                          <span className="text-xs text-gray-600 flex-1">{step.description}</span>
                          <span className="text-[10px] text-gray-400">{step.tool_calls.length} calls</span>
                          {expanded ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
                        </div>
                        {expanded && (
                          <div className="px-3 pb-3 space-y-1.5 border-t border-gray-100/50 pt-2">
                            {step.tool_calls.map(tc => (
                              <div key={tc.id} className="flex items-start gap-2 text-xs bg-gray-50/50 rounded-lg p-2">
                                <span className="mt-0.5 text-gray-400">{TOOL_ICON[tc.type] ?? <Terminal className="w-3 h-3" />}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-mono font-semibold text-gray-700">{tc.type}</span>
                                    <span className="text-[10px] text-gray-400">{tc.duration_ms}ms</span>
                                  </div>
                                  <p className="text-gray-500 truncate">{tc.input}</p>
                                  <p className="text-gray-400 truncate text-[10px]">{tc.output_summary}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {log.agent_detail.files_changed.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">변경 파일 ({log.agent_detail.files_changed.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {log.agent_detail.files_changed.map(fc => {
                        const as = FILE_ACTION_STYLE[fc.action];
                        return (
                          <span key={fc.path} className="text-[10px] font-mono px-2 py-1 rounded-lg border border-gray-200/60 flex items-center gap-1.5">
                            <span className="font-bold" style={{ color: as.color }}>{as.label}</span>
                            <span className="text-gray-600">{fc.path}</span>
                            <span className="text-gray-400">{fc.language}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {log.agent_detail.code_artifacts.length > 0 && (
                  <div className="mt-3">
                    <button
                      onClick={e => { e.stopPropagation(); setShowCode(v => !v); }}
                      className="text-xs text-violet-500 hover:text-violet-700 font-medium underline underline-offset-2"
                    >
                      {showCode ? "코드 스니펫 숨기기" : `코드 스니펫 보기 (${log.agent_detail.code_artifacts.length})`}
                    </button>
                    {showCode && (
                      <div className="mt-2 space-y-2">
                        {log.agent_detail.code_artifacts.map(ca => (
                          <div key={ca.filename} className="bg-gray-900 rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800">
                              <span className="text-xs text-gray-300 font-mono">{ca.filename}</span>
                              <span className="text-[10px] text-gray-500">{ca.language}</span>
                            </div>
                            <pre className="p-3 text-xs text-green-400 overflow-x-auto leading-relaxed">
                              <code>{ca.snippet}</code>
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function LogsTab() {
  const [teamFilter, setTeamFilter] = useState<string>("전체");
  const [channelFilter, setChannelFilter] = useState<string>("전체");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activePreset, setActivePreset] = useState<string>("");
  const [page, setPage] = useState(1);
  const [briefLog, setBriefLog] = useState<Log | null>(null);

  function applyPreset(days: number, label: string) {
    const now = new Date();
    const from = new Date(now);
    if (days === 0) {
      from.setHours(0, 0, 0, 0);
      setDateFrom(toDateString(from));
      setDateTo(toDateString(now));
    } else {
      from.setDate(from.getDate() - days);
      setDateFrom(toDateString(from));
      setDateTo(toDateString(now));
    }
    setActivePreset(label);
  }

  function clearDates() {
    setDateFrom("");
    setDateTo("");
    setActivePreset("");
  }

  const filtered = useMemo(() => MOCK_LOGS.filter(l => {
    if (teamFilter !== "전체" && l.team !== teamFilter) return false;
    if (channelFilter !== "전체" && l.channel !== channelFilter) return false;
    if (search && !l.prompt.toLowerCase().includes(search.toLowerCase()) && !l.user_name.includes(search)) return false;
    if (dateFrom) {
      const logDate = l.timestamp.slice(0, 10);
      if (logDate < dateFrom) return false;
    }
    if (dateTo) {
      const logDate = l.timestamp.slice(0, 10);
      if (logDate > dateTo) return false;
    }
    return true;
  }).sort((a, b) => b.timestamp.localeCompare(a.timestamp)), [teamFilter, channelFilter, search, dateFrom, dateTo]);

  const filteredStats = useMemo(() => ({
    totalLogs: filtered.length,
    totalCost: filtered.reduce((s, l) => s + l.cost_usd, 0),
    activeUsers: new Set(filtered.map(l => l.user_id)).size,
    avgLatency: filtered.length > 0
      ? Math.round(filtered.reduce((s, l) => s + l.latency_ms, 0) / filtered.length)
      : 0,
  }), [filtered]);

  useEffect(() => { setPage(1); }, [teamFilter, channelFilter, search, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  function getPageNumbers() {
    const delta = 2;
    const range: number[] = [];
    const left = Math.max(1, page - delta);
    const right = Math.min(totalPages, page + delta);
    for (let i = left; i <= right; i++) range.push(i);
    return range;
  }

  const hasDateFilter = dateFrom || dateTo;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Activity className="w-4 h-4" />} label="조회 로그" value={`${filteredStats.totalLogs}건`} sub={`전체 ${MOCK_LOGS.length}건`} />
        <StatCard icon={<DollarSign className="w-4 h-4" />} label="총 비용" value={`$${filteredStats.totalCost.toFixed(5)}`} sub="조회 구간" />
        <StatCard icon={<Users className="w-4 h-4" />} label="활성 유저" value={`${filteredStats.activeUsers}명`} />
        <StatCard icon={<Clock className="w-4 h-4" />} label="평균 응답시간" value={`${filteredStats.avgLatency}ms`} />
      </div>

      <div className="glass rounded-2xl p-4 mb-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-gray-500">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium text-gray-600">날짜</span>
        </div>
        <div className="flex gap-2">
          {DATE_PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p.days, p.label)}
              className={clsx("text-xs px-3 py-1.5 rounded-full font-medium transition-colors",
                activePreset === p.label ? "text-white" : "bg-white/60 text-gray-500 hover:bg-white/80")}
              style={activePreset === p.label ? { background: "var(--accent)" } : {}}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-gray-200 hidden sm:block" />
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setActivePreset(""); }}
            className="text-xs bg-white/60 border border-white/80 rounded-lg px-2 py-1.5 text-gray-600 outline-none focus:ring-1 cursor-pointer"
            style={{ colorScheme: "light" }} />
          <span className="text-gray-400 text-xs">~</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setActivePreset(""); }}
            className="text-xs bg-white/60 border border-white/80 rounded-lg px-2 py-1.5 text-gray-600 outline-none focus:ring-1 cursor-pointer"
            style={{ colorScheme: "light" }} />
          {hasDateFilter && (
            <button onClick={clearDates}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 bg-white/60 px-2 py-1.5 rounded-lg transition-colors">
              <X className="w-3 h-3" /> 초기화
            </button>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-gray-400">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium text-gray-600">필터</span>
        </div>
        <div className="flex gap-2">
          {["전체", ...MOCK_TEAMS].map(t => (
            <button key={t} onClick={() => setTeamFilter(t)}
              className={clsx("text-xs px-3 py-1.5 rounded-full font-medium transition-colors",
                teamFilter === t ? "text-white" : "bg-white/60 text-gray-500 hover:bg-white/80")}
              style={teamFilter === t ? { background: "var(--accent)" } : {}}>
              {t}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-gray-200 hidden sm:block" />
        <div className="flex gap-2 flex-wrap">
          {["전체", "anthropic", "openai", "gemini", "extension", "crawler"].map(c => (
            <button key={c} onClick={() => setChannelFilter(c)}
              className={clsx("text-xs px-3 py-1.5 rounded-full font-medium transition-colors",
                channelFilter === c ? "text-white" : "bg-white/60 text-gray-500 hover:bg-white/80")}
              style={channelFilter === c ? { background: "var(--accent)" } : {}}>
              {c}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 bg-white/60 rounded-xl px-3 py-1.5">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" placeholder="유저명 또는 프롬프트 검색" value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-48" />
          {search && (
            <button onClick={() => setSearch("")}>
              <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/50 bg-white/20">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">유저</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">팀</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">채널</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">모델</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">프롬프트</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">토큰</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">비용</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">지연</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">시간</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Calendar className="w-8 h-8 opacity-40" />
                      <p className="text-sm">조건에 맞는 로그가 없습니다</p>
                      {hasDateFilter && (
                        <button onClick={clearDates} className="text-xs mt-1 underline hover:text-gray-600">
                          날짜 필터 초기화
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map(log => <LogRow key={log.id} log={log} onShowBrief={setBriefLog} />)
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-white/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400 shrink-0">
            {filtered.length === 0 ? "0건" : (
              <>
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}
                {" "}/ {filtered.length}건
                {filtered.length < MOCK_LOGS.length && ` (전체 ${MOCK_LOGS.length}건)`}
              </>
            )}
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronsLeft className="w-3.5 h-3.5 text-gray-500" />
              </button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
              </button>

              {getPageNumbers()[0] > 1 && (
                <>
                  <button onClick={() => setPage(1)}
                    className="w-7 h-7 text-xs rounded-lg hover:bg-white/60 text-gray-500 transition-colors">1</button>
                  {getPageNumbers()[0] > 2 && <span className="text-gray-300 text-xs px-0.5">&hellip;</span>}
                </>
              )}

              {getPageNumbers().map(n => (
                <button key={n} onClick={() => setPage(n)}
                  className={clsx("w-7 h-7 text-xs rounded-lg font-medium transition-colors",
                    n === page ? "text-white" : "hover:bg-white/60 text-gray-500")}
                  style={n === page ? { background: "var(--accent)" } : {}}>
                  {n}
                </button>
              ))}

              {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                <>
                  {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && <span className="text-gray-300 text-xs px-0.5">&hellip;</span>}
                  <button onClick={() => setPage(totalPages)}
                    className="w-7 h-7 text-xs rounded-lg hover:bg-white/60 text-gray-500 transition-colors">{totalPages}</button>
                </>
              )}

              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
              </button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronsRight className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          )}

          {(hasDateFilter || teamFilter !== "전체" || channelFilter !== "전체" || search) && (
            <button onClick={() => { clearDates(); setTeamFilter("전체"); setChannelFilter("전체"); setSearch(""); }}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 shrink-0">
              <X className="w-3 h-3" /> 전체 초기화
            </button>
          )}
        </div>
      </div>

      {briefLog && <AgentBriefModal log={briefLog} onClose={() => setBriefLog(null)} />}
    </>
  );
}
