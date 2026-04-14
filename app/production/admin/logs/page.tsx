"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { FileText, Search, X, Filter, ChevronDown, ChevronRight, Code, Terminal, File, Clock, Cpu } from "lucide-react";
import clsx from "clsx";
import type { Log, Team } from "@/types";
import { teamsApi } from "@/lib/api";
import { MOCK_LOGS } from "@/lib/mockData";

const CHANNELS = ["전체", "anthropic", "openai", "gemini", "extension", "crawler"];
const PAGE_SIZE = 15;

export default function LogsPage() {
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("전체");
  const [teamFilter, setTeamFilter] = useState("전체");
  const [teams, setTeams] = useState<Team[]>([]);
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  const fetchTeams = useCallback(async () => {
    const res = await teamsApi.list();
    if (res.data) setTeams(res.data.teams);
  }, []);
  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const filtered = useMemo(() => MOCK_LOGS.filter(l => {
    if (teamFilter !== "전체" && l.team !== teamFilter) return false;
    if (channelFilter !== "전체" && l.channel !== channelFilter) return false;
    if (search && !l.user_name.includes(search) && !l.prompt.includes(search)) return false;
    return true;
  }), [teamFilter, channelFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI 로그</h1>
        <p className="text-sm text-gray-500">전체 AI 사용 로그 조회 · {MOCK_LOGS.length}건</p>
      </div>

      {/* 필터 */}
      <div className="glass rounded-2xl p-3 mb-4 space-y-2">
        {/* 팀 필터 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500 w-8">팀</span>
          {["전체", ...teams.map(t => t.name)].map(t => (
            <button key={t} onClick={() => { setTeamFilter(t); setPage(1); }}
              className={clsx("text-xs px-3 py-1.5 rounded-full font-medium transition-colors",
                teamFilter === t ? "text-white" : "bg-white/60 text-gray-500 hover:bg-white/80")}
              style={teamFilter === t ? { background: "var(--accent)" } : {}}>
              {t}
            </button>
          ))}
        </div>
        {/* 채널 필터 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500 w-8">채널</span>
          {CHANNELS.map(ch => (
            <button key={ch} onClick={() => { setChannelFilter(ch); setPage(1); }}
              className={clsx("text-xs px-3 py-1.5 rounded-full font-medium transition-colors",
                channelFilter === ch ? "text-white" : "bg-white/60 text-gray-500 hover:bg-white/80")}
              style={channelFilter === ch ? { background: "var(--accent)" } : {}}>
              {ch}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 bg-white/60 rounded-xl px-3 py-1.5">
            <Search className="w-4 h-4 text-gray-400" />
            <input type="text" placeholder="유저명 또는 프롬프트 검색"
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-52" />
            {search && <button onClick={() => setSearch("")}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
          </div>
        </div>
      </div>

      {/* 로그 테이블 */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/50 bg-white/20">
                {["", "시간", "유저", "팀", "채널", "모델", "프롬프트", "비용", "토큰"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.map(log => (
                <>
                  <tr key={log.id} onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                    className={clsx("border-b border-white/50 hover:bg-white/20 transition-colors cursor-pointer",
                      selectedLog?.id === log.id && "bg-white/30")}>
                    <td className="px-4 py-3">
                      {log.mode === "agent"
                        ? <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                        : <ChevronRight className={clsx("w-3.5 h-3.5 text-gray-300 transition-transform", selectedLog?.id === log.id && "rotate-90")} />}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{log.user_name}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{log.team}</td>
                    <td className="px-4 py-3"><span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">{log.channel}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-600">{log.model}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[200px]">{log.prompt}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700">${log.cost_usd.toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{(log.input_tokens + log.output_tokens).toLocaleString()}</td>
                  </tr>
                  {selectedLog?.id === log.id && (
                    <tr key={`${log.id}-detail`}>
                      <td colSpan={9} className="p-0">
                        <LogDetailPanel log={log} onClose={() => setSelectedLog(null)} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="px-4 py-3 border-t border-white/50 flex items-center justify-between">
          <p className="text-xs text-gray-400">{filtered.length}건 중 {(page - 1) * PAGE_SIZE + 1}~{Math.min(page * PAGE_SIZE, filtered.length)}</p>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={clsx("w-7 h-7 rounded-lg text-xs font-medium transition-colors",
                  page === p ? "text-white" : "text-gray-500 hover:bg-white/60")}
                style={page === p ? { background: "var(--accent)" } : {}}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** 로그 상세 패널 (테이블 행 아래 확장) */
function LogDetailPanel({ log, onClose }: { log: Log; onClose: () => void }) {
  const agent = log.agent_detail;

  return (
    <div className="bg-white/40 border-t border-b border-white/60 px-6 py-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {log.mode === "agent" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Agent Mode</span>}
          <span className="text-xs text-gray-400">{log.model} · {log.channel}</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* 프롬프트 */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">프롬프트</p>
          <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
            {log.prompt}
          </div>
        </div>
        {/* 응답 */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">응답</p>
          <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
            {log.response}
          </div>
        </div>
      </div>

      {/* 메타데이터 */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
        <span>입력 토큰: <b className="text-gray-700">{log.input_tokens.toLocaleString()}</b></span>
        <span>출력 토큰: <b className="text-gray-700">{log.output_tokens.toLocaleString()}</b></span>
        <span>비용: <b className="text-gray-700">${log.cost_usd.toFixed(2)}</b></span>
        <span>지연: <b className="text-gray-700">{log.latency_ms.toLocaleString()}ms</b></span>
      </div>

      {/* 에이전트 상세 (mode=agent일 때만) */}
      {agent && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-4 h-4 text-indigo-500" />
            <p className="text-xs font-semibold text-gray-700 uppercase">에이전트 세션</p>
            <span className="text-[10px] text-gray-400 font-mono">{agent.session_id}</span>
          </div>

          <div className="flex gap-4 text-xs text-gray-500 mb-4">
            <span>{agent.total_steps}단계</span>
            <span>{agent.total_tool_calls} 도구 호출</span>
            <span>{agent.files_changed.length} 파일 변경</span>
            <span>{(agent.session_duration_ms / 1000).toFixed(0)}초</span>
          </div>

          {/* Steps */}
          <div className="space-y-2 mb-4">
            {agent.steps.map(step => (
              <div key={step.step} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600">Step {step.step}</span>
                  <span className={clsx("text-[10px] font-medium px-1.5 py-0.5 rounded",
                    step.phase === "plan" ? "bg-blue-100 text-blue-600" :
                    step.phase === "execute" ? "bg-emerald-100 text-emerald-600" :
                    step.phase === "verify" ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-600"
                  )}>{step.phase}</span>
                  <span className="text-xs text-gray-600">{step.description}</span>
                </div>
                {step.tool_calls.length > 0 && (
                  <div className="ml-4 space-y-0.5">
                    {step.tool_calls.map((tc, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px] text-gray-400">
                        <ToolIcon type={tc.type} />
                        <span className="font-mono text-gray-500">{tc.type}</span>
                        <span className="text-gray-400 truncate">{tc.input}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 변경 파일 */}
          {agent.files_changed.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">변경된 파일</p>
              <div className="space-y-1">
                {agent.files_changed.map((fc, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <File className="w-3 h-3 text-gray-400" />
                    <span className="font-mono text-gray-600">{fc.path}</span>
                    <span className="text-emerald-500">+{fc.additions}</span>
                    <span className="text-red-400">-{fc.deletions}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 코드 아티팩트 */}
          {agent.code_artifacts && agent.code_artifacts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">코드 아티팩트</p>
              {agent.code_artifacts.map((art, i) => (
                <div key={i} className="rounded-lg border border-gray-100 bg-gray-900 p-3 mb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="w-3 h-3 text-gray-400" />
                    <span className="text-[10px] text-gray-400">{art.filename} · {art.language}</span>
                  </div>
                  <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">{art.snippet}</pre>
                </div>
              ))}
            </div>
          )}

          {/* 요약 */}
          {agent.summary && (
            <div className="mt-3 rounded-lg bg-indigo-50 border border-indigo-100 p-3">
              <p className="text-xs font-semibold text-indigo-600 mb-1">세션 요약</p>
              <p className="text-xs text-gray-600">{agent.summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ToolIcon({ type }: { type: string }) {
  switch (type) {
    case "bash": return <Terminal className="w-3 h-3 text-gray-400" />;
    case "file_read": case "file_write": case "edit": return <File className="w-3 h-3 text-gray-400" />;
    case "glob": case "grep": return <Search className="w-3 h-3 text-gray-400" />;
    default: return <Code className="w-3 h-3 text-gray-400" />;
  }
}
