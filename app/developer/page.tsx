"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ChevronDown, ChevronUp, BarChart2,
  AlertTriangle, Info, CheckCircle, TrendingUp,
  Search, Filter, Calendar, X,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Activity, DollarSign, Clock, Zap, History,
  Bot, Terminal, FileCode, Edit3, Search as SearchIcon, Globe,
} from "lucide-react";
import type { Log } from "@/types";
import { MY_LOGS, MATURITY_DATA } from "@/lib/mockData";
import clsx from "clsx";

const CHANNEL_COLORS: Record<string, string> = {
  anthropic: "bg-orange-100 text-orange-700",
  openai:    "bg-green-100 text-green-700",
  gemini:    "bg-blue-100 text-blue-700",
  extension: "bg-purple-100 text-purple-700",
  crawler:   "bg-gray-100 text-gray-600",
};

const COACHING_ICONS = {
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  info:    <Info className="w-5 h-5 text-blue-500" />,
  success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
};

const COACHING_BG = {
  warning: "border-amber-200 bg-amber-50/60",
  info:    "border-blue-200 bg-blue-50/60",
  success: "border-emerald-200 bg-emerald-50/60",
};

const PAGE_SIZE = 20;

const DATE_PRESETS = [
  { label: "오늘",     days: 0 },
  { label: "최근 7일",  days: 7 },
  { label: "최근 14일", days: 14 },
  { label: "최근 30일", days: 30 },
];

function toDateString(d: Date) {
  return d.toISOString().slice(0, 10);
}

// ── 에이전트 모드 헬퍼 ──
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
              <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</p>
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
          <div className="bg-violet-50/60 rounded-xl p-3 text-sm text-gray-700 leading-relaxed border border-violet-100">{log.prompt}</div>
        </div>
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-600">R</div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">구현 결과 요약</p>
          </div>
          <div className="bg-emerald-50/60 rounded-xl p-3 text-sm text-gray-700 leading-relaxed border border-emerald-100">{d.summary}</div>
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
                  {i < d.steps.length - 1 && <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">파일 변경 내역 ({d.files_changed.length}개)</p>
          <div className="bg-white/50 rounded-xl p-3 space-y-1.5">
            {d.files_changed.map(fc => {
              const as = FILE_ACTION_STYLE[fc.action];
              const actionLabel = fc.action === "created" ? "생성" : fc.action === "modified" ? "수정" : "삭제";
              return (
                <div key={fc.path} className="flex items-center gap-2 text-xs">
                  <span className="font-bold w-8 text-center text-[10px] px-1 py-0.5 rounded" style={{ background: `${as.color}18`, color: as.color }}>{actionLabel}</span>
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
  const [showRaw, setShowRaw] = useState(false);
  const agent = isAgentLog(log);
  const d = log.agent_detail;

  const toggleStep = (s: number) => setExpandedSteps(prev => {
    const next = new Set(prev);
    next.has(s) ? next.delete(s) : next.add(s);
    return next;
  });

  return (
    <>
      <tr
        className="border-b border-white/50 hover:bg-white/30 cursor-pointer transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <td className="px-4 py-3">
          <span className="flex items-center gap-1">
            <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full", CHANNEL_COLORS[log.channel])}>
              {log.channel}
            </span>
            {agent && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 flex items-center gap-0.5">
                <Bot className="w-3 h-3" /> Agent
              </span>
            )}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{log.model}</td>
        <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
          <span className="flex items-center gap-1.5">
            {agent ? d!.summary : log.prompt}
            {agent && (
              <button
                onClick={(e) => { e.stopPropagation(); onShowBrief?.(log); }}
                className="flex-shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 hover:bg-violet-200 transition-colors whitespace-nowrap"
              >
                요약 보기
              </button>
            )}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
          {log.input_tokens + log.output_tokens}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
          ${log.cost_usd.toFixed(6)}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
          {agent ? `${(log.latency_ms / 1000).toFixed(0)}s` : `${log.latency_ms}ms`}
        </td>
        <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
          {new Date(log.timestamp).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
        </td>
        <td className="px-4 py-3 text-gray-400">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </td>
      </tr>
      {open && (
        <tr className="bg-white/20">
          <td colSpan={8} className="px-6 py-4">
            {agent && d ? (
              <>
                {/* 세션 헤더 */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "소요 시간", value: `${(d.session_duration_ms / 1000).toFixed(0)}초` },
                    { label: "스텝 수", value: `${d.total_steps}단계` },
                    { label: "도구 호출", value: `${d.total_tool_calls}회` },
                    { label: "변경 파일", value: `${d.files_changed.length}개` },
                  ].map(s => (
                    <div key={s.label} className="bg-violet-50/80 rounded-xl px-3 py-2 text-center">
                      <div className="text-sm font-bold text-violet-700">{s.value}</div>
                      <div className="text-[10px] text-violet-400">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-5 gap-4 mb-4">
                  {/* 워크플로 타임라인 */}
                  <div className="col-span-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Workflow Timeline</p>
                    <div className="space-y-2">
                      {d.steps.map(step => {
                        const ps = PHASE_STYLE[step.phase];
                        const isOpen = expandedSteps.has(step.step);
                        return (
                          <div key={step.step} className="bg-white/50 rounded-xl overflow-hidden">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleStep(step.step); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/40 transition-colors"
                            >
                              <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: ps.bg, color: ps.color }}>
                                {ps.label}
                              </span>
                              <span className="text-xs text-gray-700 flex-1">{step.description}</span>
                              <span className="text-[10px] text-gray-400">{step.tool_calls.length} calls</span>
                              {isOpen ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
                            </button>
                            {isOpen && (
                              <div className="px-3 pb-2 space-y-1">
                                {step.tool_calls.map(tc => (
                                  <div key={tc.id} className="flex items-center gap-2 text-[11px] py-1 px-2 bg-gray-50/80 rounded-lg">
                                    <span className="text-gray-400">{TOOL_ICON[tc.type] ?? <Terminal className="w-3 h-3" />}</span>
                                    <span className="font-mono text-gray-600 truncate max-w-[200px]">{tc.input}</span>
                                    <span className="text-gray-400 truncate flex-1">{tc.output_summary}</span>
                                    <span className="text-gray-300 text-[10px] flex-shrink-0">{tc.duration_ms}ms</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 파일 변경 패널 */}
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">File Changes</p>
                    <div className="bg-white/50 rounded-xl p-3 space-y-1.5">
                      {d.files_changed.map(fc => {
                        const as = FILE_ACTION_STYLE[fc.action];
                        return (
                          <div key={fc.path} className="flex items-center gap-2 text-[11px]">
                            <span className="font-bold w-4 text-center" style={{ color: as.color }}>{as.label}</span>
                            <span className="font-mono text-gray-600 truncate flex-1">{fc.path}</span>
                            <span className="text-green-600 text-[10px]">+{fc.additions}</span>
                            {fc.deletions > 0 && <span className="text-red-500 text-[10px]">-{fc.deletions}</span>}
                            <span className="text-[9px] px-1 py-0.5 rounded bg-gray-100 text-gray-500">{fc.language}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 코드 산출물 */}
                {d.code_artifacts.length > 0 && (
                  <div className="mb-3">
                    <button onClick={(e) => { e.stopPropagation(); setShowCode(!showCode); }}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase mb-1 hover:text-gray-600">
                      <FileCode className="w-3 h-3" /> Code Artifacts
                      {showCode ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {showCode && (
                      <div className="space-y-2">
                        {d.code_artifacts.map(ca => (
                          <div key={ca.filename}>
                            <div className="text-[10px] font-mono text-gray-400 mb-0.5">{ca.filename}</div>
                            <pre className="bg-gray-900 text-green-400 text-[11px] rounded-lg p-3 overflow-x-auto font-mono leading-relaxed">
                              {ca.snippet}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Raw Prompt/Response */}
                <button onClick={(e) => { e.stopPropagation(); setShowRaw(!showRaw); }}
                  className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase hover:text-gray-600">
                  Raw Prompt / Response {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {showRaw && (
                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Prompt</p>
                      <p className="text-gray-700 bg-white/50 rounded-lg p-3 whitespace-pre-wrap">{log.prompt}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Response</p>
                      <p className="text-gray-700 bg-white/50 rounded-lg p-3 whitespace-pre-wrap">{log.response}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Prompt</p>
                    <p className="text-gray-700 bg-white/50 rounded-lg p-3 whitespace-pre-wrap">{log.prompt}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Response</p>
                    <p className="text-gray-700 bg-white/50 rounded-lg p-3 whitespace-pre-wrap">{log.response}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 mt-3">
                  <div className="bg-white/40 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-400">입력 토큰</p>
                    <p className="text-sm font-semibold text-gray-700">{log.input_tokens.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/40 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-400">출력 토큰</p>
                    <p className="text-sm font-semibold text-gray-700">{log.output_tokens.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/40 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-400">비용</p>
                    <p className="text-sm font-semibold text-gray-700">${log.cost_usd.toFixed(6)}</p>
                  </div>
                  <div className="bg-white/40 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-400">응답 속도</p>
                    <p className="text-sm font-semibold text-gray-700">{agent ? `${(log.latency_ms / 1000).toFixed(0)}s` : `${log.latency_ms}ms`}</p>
                  </div>
                </div>
              </>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function DeveloperPage() {
  const router = useRouter();
  const { coachingCards } = MATURITY_DATA;

  // 필터 상태
  const [channelFilter, setChannelFilter] = useState<string>("전체");
  const [modelFilter, setModelFilter]   = useState<string>("전체");
  const [search, setSearch]             = useState("");
  const [dateFrom, setDateFrom]         = useState("");
  const [dateTo, setDateTo]             = useState("");
  const [activePreset, setActivePreset] = useState<string>("");
  const [page, setPage]                 = useState(1);
  const [briefLog, setBriefLog]         = useState<Log | null>(null);

  // 모델 목록 동적 생성
  const modelList = useMemo(() => {
    const set = new Set(MY_LOGS.map(l => l.model));
    return ["전체", ...Array.from(set).sort()];
  }, []);

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

  function clearAll() {
    setChannelFilter("전체");
    setModelFilter("전체");
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setActivePreset("");
  }

  // 필터링
  const filtered = useMemo(() => MY_LOGS.filter(l => {
    if (channelFilter !== "전체" && l.channel !== channelFilter) return false;
    if (modelFilter !== "전체" && l.model !== modelFilter) return false;
    if (search && !l.prompt.toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFrom) {
      const logDate = l.timestamp.slice(0, 10);
      if (logDate < dateFrom) return false;
    }
    if (dateTo) {
      const logDate = l.timestamp.slice(0, 10);
      if (logDate > dateTo) return false;
    }
    return true;
  }).sort((a, b) => b.timestamp.localeCompare(a.timestamp)), [channelFilter, modelFilter, search, dateFrom, dateTo]);

  // 필터된 통계
  const filteredStats = useMemo(() => ({
    totalLogs:  filtered.length,
    totalCost:  filtered.reduce((s, l) => s + l.cost_usd, 0),
    totalTokens: filtered.reduce((s, l) => s + l.input_tokens + l.output_tokens, 0),
    avgLatency: filtered.length > 0
      ? Math.round(filtered.reduce((s, l) => s + l.latency_ms, 0) / filtered.length)
      : 0,
  }), [filtered]);

  // 필터 변경 시 페이지 리셋
  useEffect(() => { setPage(1); }, [channelFilter, modelFilter, search, dateFrom, dateTo]);

  // 페이지네이션
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  function getPageNumbers() {
    const delta = 2;
    const range: number[] = [];
    const left  = Math.max(1, page - delta);
    const right = Math.min(totalPages, page + delta);
    for (let i = left; i <= right; i++) range.push(i);
    return range;
  }

  const hasFilter = channelFilter !== "전체" || modelFilter !== "전체" || search || dateFrom || dateTo;
  const hasDateFilter = dateFrom || dateTo;

  return (
    <main
      className="min-h-screen p-6"
      style={{ background: "var(--bg-base)" }}
    >
      {/* 배경 장식 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div
          className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
          style={{ background: "#10B981" }}
        />
      </div>

      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="p-2 rounded-xl glass hover:scale-105 transition-transform"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">내 AI 로그</h1>
              <p className="text-sm text-gray-500">강지수 · 개발팀</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/developer/reports")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/60 transition-colors glass border border-white/50 text-gray-600"
            >
              <History className="w-4 h-4" />
              지난 평가
            </button>
            <button
              onClick={() => router.push("/developer/report")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity"
              style={{ background: "var(--accent)" }}
            >
              <BarChart2 className="w-4 h-4" />
              AI Maturity Report
            </button>
          </div>
        </div>

        {/* 내 통계 — 필터 반영 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="glass rounded-2xl p-5 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-gray-400 text-xs">
              <Activity className="w-3.5 h-3.5" />
              <span>조회 로그</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{filteredStats.totalLogs}건</p>
            <p className="text-xs text-gray-400">전체 {MY_LOGS.length}건</p>
          </div>
          <div className="glass rounded-2xl p-5 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-gray-400 text-xs">
              <Zap className="w-3.5 h-3.5" />
              <span>총 토큰</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{filteredStats.totalTokens.toLocaleString()}</p>
            <p className="text-xs text-gray-400">조회 구간</p>
          </div>
          <div className="glass rounded-2xl p-5 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-gray-400 text-xs">
              <DollarSign className="w-3.5 h-3.5" />
              <span>총 비용</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">${filteredStats.totalCost.toFixed(5)}</p>
            <p className="text-xs text-gray-400">조회 구간</p>
          </div>
          <div className="glass rounded-2xl p-5 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-gray-400 text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>평균 응답</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{filteredStats.avgLatency}ms</p>
            <p className="text-xs text-gray-400">조회 구간</p>
          </div>
        </div>

        {/* 코칭 카드 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-widest">
              이번 주 AI 코칭 카드
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {coachingCards.map((card, i) => (
              <div
                key={i}
                className={clsx(
                  "rounded-2xl border p-5 flex flex-col gap-3 backdrop-blur-sm",
                  COACHING_BG[card.type as keyof typeof COACHING_BG]
                )}
              >
                <div className="flex items-start gap-3">
                  {COACHING_ICONS[card.type as keyof typeof COACHING_ICONS]}
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 mb-1">트리거</p>
                    <p className="text-sm font-medium text-gray-800">{card.trigger}</p>
                  </div>
                </div>
                <div className="bg-white/60 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">권장 액션</p>
                  <p className="text-sm text-gray-700">{card.message}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">예상 효과</p>
                  <p className="text-xs font-medium text-gray-600">{card.effect}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 내 로그 테이블 */}
        <div className="glass rounded-2xl overflow-hidden">
          {/* 테이블 헤더 + 필터 */}
          <div className="px-5 pt-4 pb-3 border-b border-white/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-800">내 AI 사용 로그</h2>
                <p className="text-xs text-gray-400 mt-0.5">행 클릭 시 상세 내용 확인</p>
              </div>
              {hasFilter && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-lg hover:bg-white/40"
                >
                  <X className="w-3 h-3" /> 필터 초기화
                </button>
              )}
            </div>

            {/* 필터 행 1: 검색 + 채널 + 모델 */}
            <div className="flex flex-wrap gap-2">
              {/* 검색 */}
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="프롬프트 검색..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-white/50 border border-white/60 focus:outline-none focus:ring-2 focus:ring-blue-200 placeholder:text-gray-400"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                    <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              {/* 채널 필터 */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                {["전체", "anthropic", "openai", "gemini", "extension", "crawler"].map(c => (
                  <button
                    key={c}
                    onClick={() => setChannelFilter(c)}
                    className={clsx(
                      "text-xs px-2.5 py-1 rounded-full transition-colors border",
                      channelFilter === c
                        ? "text-white border-transparent"
                        : "bg-white/40 border-white/60 text-gray-500 hover:bg-white/60"
                    )}
                    style={channelFilter === c ? { background: "var(--accent)" } : {}}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* 필터 행 2: 모델 + 날짜 */}
            <div className="flex flex-wrap gap-2 items-center">
              {/* 모델 필터 */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">모델</span>
                <select
                  value={modelFilter}
                  onChange={e => setModelFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-white/50 border border-white/60 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {modelList.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* 날짜 프리셋 */}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {DATE_PRESETS.map(({ label, days }) => (
                  <button
                    key={label}
                    onClick={() => applyPreset(days, label)}
                    className={clsx(
                      "text-xs px-2.5 py-1 rounded-full transition-colors border",
                      activePreset === label
                        ? "text-white border-transparent"
                        : "bg-white/40 border-white/60 text-gray-500 hover:bg-white/60"
                    )}
                    style={activePreset === label ? { background: "var(--accent)" } : {}}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* 날짜 직접 입력 */}
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => { setDateFrom(e.target.value); setActivePreset(""); }}
                  className="text-xs px-2 py-1 rounded-lg bg-white/50 border border-white/60 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <span className="text-xs text-gray-400">~</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => { setDateTo(e.target.value); setActivePreset(""); }}
                  className="text-xs px-2 py-1 rounded-lg bg-white/50 border border-white/60 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                {hasDateFilter && (
                  <button onClick={clearDates} className="p-1 rounded hover:bg-white/40">
                    <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/50 bg-white/20">
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
                {paginated.length > 0
                  ? paginated.map(log => <LogRow key={log.id} log={log} onShowBrief={setBriefLog} />)
                  : (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                        조건에 맞는 로그가 없습니다
                      </td>
                    </tr>
                  )
                }
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 푸터 */}
          <div className="px-5 py-3 border-t border-white/50 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-gray-400">
              {filtered.length > 0
                ? <>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}건</>
                : "0건"
              }
              {hasFilter && <span className="ml-1 text-gray-300">· 전체 {MY_LOGS.length}건</span>}
            </p>

            <div className="flex items-center gap-1">
              {/* 처음 */}
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-white/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsLeft className="w-4 h-4 text-gray-500" />
              </button>
              {/* 이전 */}
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-white/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>

              {/* 첫 페이지 + 줄임표 */}
              {getPageNumbers()[0] > 1 && (
                <>
                  <button
                    onClick={() => setPage(1)}
                    className="min-w-[28px] h-7 text-xs rounded-lg hover:bg-white/40 text-gray-500 transition-colors"
                  >1</button>
                  {getPageNumbers()[0] > 2 && (
                    <span className="text-xs text-gray-300 px-1">…</span>
                  )}
                </>
              )}

              {/* 페이지 번호 */}
              {getPageNumbers().map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={clsx(
                    "min-w-[28px] h-7 text-xs rounded-lg transition-colors",
                    n === page
                      ? "text-white font-semibold"
                      : "hover:bg-white/40 text-gray-500"
                  )}
                  style={n === page ? { background: "var(--accent)" } : {}}
                >
                  {n}
                </button>
              ))}

              {/* 마지막 페이지 + 줄임표 */}
              {getPageNumbers().at(-1)! < totalPages && (
                <>
                  {getPageNumbers().at(-1)! < totalPages - 1 && (
                    <span className="text-xs text-gray-300 px-1">…</span>
                  )}
                  <button
                    onClick={() => setPage(totalPages)}
                    className="min-w-[28px] h-7 text-xs rounded-lg hover:bg-white/40 text-gray-500 transition-colors"
                  >{totalPages}</button>
                </>
              )}

              {/* 다음 */}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-white/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
              {/* 마지막 */}
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-white/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
      {briefLog && <AgentBriefModal log={briefLog} onClose={() => setBriefLog(null)} />}
    </main>
  );
}
