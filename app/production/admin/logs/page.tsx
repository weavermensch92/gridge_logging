"use client";

import { useState, useMemo } from "react";
import { FileText, Search, X, Filter } from "lucide-react";
import clsx from "clsx";
import { MOCK_LOGS } from "@/lib/mockData";

const CHANNELS = ["전체", "anthropic", "openai", "gemini", "extension", "crawler"];
const PAGE_SIZE = 15;

export default function LogsPage() {
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("전체");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return MOCK_LOGS.filter(log => {
      if (channelFilter !== "전체" && log.channel !== channelFilter) return false;
      if (search && !log.user_name.includes(search) && !log.prompt.includes(search)) return false;
      return true;
    });
  }, [channelFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI 로그</h1>
        <p className="text-sm text-gray-500">전체 AI 사용 로그 조회 · {MOCK_LOGS.length}건</p>
      </div>

      {/* 필터 */}
      <div className="glass rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-gray-400" />
        <div className="flex gap-2">
          {CHANNELS.map(ch => (
            <button key={ch} onClick={() => { setChannelFilter(ch); setPage(1); }}
              className={clsx("text-xs px-3 py-1.5 rounded-full font-medium transition-colors",
                channelFilter === ch ? "text-white" : "bg-white/60 text-gray-500 hover:bg-white/80")}
              style={channelFilter === ch ? { background: "var(--accent)" } : {}}>
              {ch}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 bg-white/60 rounded-xl px-3 py-1.5">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" placeholder="유저명 또는 프롬프트 검색"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-52" />
          {search && <button onClick={() => setSearch("")}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
        </div>
      </div>

      {/* 로그 테이블 */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/50 bg-white/20">
                {["시간", "유저", "팀", "채널", "모델", "프롬프트", "비용", "토큰"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.map(log => (
                <tr key={log.id} className="border-b border-white/50 hover:bg-white/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{log.user_name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{log.team}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">{log.channel}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{log.model}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[250px]">{log.prompt}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-700">${log.cost_usd.toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{(log.input_tokens + log.output_tokens).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="px-4 py-3 border-t border-white/50 flex items-center justify-between">
          <p className="text-xs text-gray-400">{filtered.length}건 중 {(page - 1) * PAGE_SIZE + 1}~{Math.min(page * PAGE_SIZE, filtered.length)}</p>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
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
