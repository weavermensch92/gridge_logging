"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { FileText, Search, X } from "lucide-react";
import clsx from "clsx";
import type { User } from "@/types";
import { usersApi } from "@/lib/api";
import { MOCK_LOGS } from "@/lib/mockData";

const MY_TEAM_NAME = "개발팀";
const MY_TEAM_ID = "team-001";
const CHANNELS = ["전체", "anthropic", "openai", "gemini", "extension"];

export default function TeamLeadLogs() {
  const [members, setMembers] = useState<User[]>([]);
  const [userFilter, setUserFilter] = useState("전체");
  const [channelFilter, setChannelFilter] = useState("전체");
  const [search, setSearch] = useState("");

  const fetchMembers = useCallback(async () => {
    const res = await usersApi.list({ team_id: MY_TEAM_ID });
    if (res.data) setMembers(res.data.users);
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const memberNames = members.map(m => m.name);
  const teamLogs = useMemo(() => MOCK_LOGS.filter(l => l.team === MY_TEAM_NAME), []);

  const filtered = useMemo(() => teamLogs.filter(l => {
    if (userFilter !== "전체" && l.user_name !== userFilter) return false;
    if (channelFilter !== "전체" && l.channel !== channelFilter) return false;
    if (search && !l.user_name.includes(search) && !l.prompt.includes(search)) return false;
    return true;
  }), [teamLogs, userFilter, channelFilter, search]);

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">팀 AI 로그</h1>
        <p className="text-sm text-gray-500">개발팀 · {teamLogs.length}건</p>
      </div>

      {/* 필터 */}
      <div className="glass rounded-2xl p-3 mb-4 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500 w-10">유저</span>
          {["전체", ...memberNames].map(name => (
            <button key={name} onClick={() => setUserFilter(name)}
              className={clsx("text-xs px-3 py-1.5 rounded-full font-medium transition-colors",
                userFilter === name ? "text-white" : "bg-white/60 text-gray-500 hover:bg-white/80")}
              style={userFilter === name ? { background: "var(--accent)" } : {}}>
              {name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500 w-10">채널</span>
          {CHANNELS.map(ch => (
            <button key={ch} onClick={() => setChannelFilter(ch)}
              className={clsx("text-xs px-3 py-1.5 rounded-full font-medium transition-colors",
                channelFilter === ch ? "text-white" : "bg-white/60 text-gray-500 hover:bg-white/80")}
              style={channelFilter === ch ? { background: "var(--accent)" } : {}}>
              {ch}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 bg-white/60 rounded-xl px-3 py-1.5">
            <Search className="w-4 h-4 text-gray-400" />
            <input type="text" placeholder="검색" value={search} onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-40" />
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
                {["시간", "유저", "채널", "모델", "프롬프트", "비용", "토큰"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">로그가 없습니다.</td></tr>
              ) : filtered.slice(0, 30).map(log => (
                <tr key={log.id} className="border-b border-white/50 hover:bg-white/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{log.user_name}</td>
                  <td className="px-4 py-3"><span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">{log.channel}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-600">{log.model}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[250px]">{log.prompt}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-700">${log.cost_usd.toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{(log.input_tokens + log.output_tokens).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-white/50">
          <p className="text-xs text-gray-400">{Math.min(filtered.length, 30)}건 표시 · 전체 {filtered.length}건</p>
        </div>
      </div>
    </div>
  );
}
