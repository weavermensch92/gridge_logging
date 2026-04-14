"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Loader2, UserPlus, ToggleLeft, ToggleRight,
  Trash2, Search, X,
} from "lucide-react";
import clsx from "clsx";
import type { User, AiToolType } from "@/types";
import { usersApi } from "@/lib/api";

const MY_TEAM_ID = "team-001";

const AI_TOOL_LABEL: Record<AiToolType, string> = {
  chatgpt: "ChatGPT", claude_web: "Claude 웹", gemini_web: "Gemini 웹",
  claude_code: "Claude Code", cursor: "Cursor",
};

const ONBOARDING_LABEL: Record<string, string> = {
  password_change: "비밀번호 변경 대기", tool_install: "도구 설치 중", complete: "",
};

export default function TeamLeadMembers() {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const res = await usersApi.list({ team_id: MY_TEAM_ID });
    if (res.data) setMembers(res.data.users);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const filtered = search ? members.filter(m => m.name.includes(search) || m.email.includes(search.toLowerCase())) : members;

  const toggleAi = async (user: User) => {
    await usersApi.update(user.id, { ai_enabled: !user.ai_enabled });
    fetchMembers();
  };

  const suspendUser = async (user: User) => {
    if (!confirm(`${user.name}님을 비활성화하시겠습니까?`)) return;
    await usersApi.remove(user.id);
    fetchMembers();
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">팀원 관리</h1>
          <p className="text-sm text-gray-500">개발팀 · 팀원 AI 권한 관리</p>
        </div>
      </div>

      {/* 검색 */}
      <div className="glass rounded-2xl p-3 mb-4 flex items-center gap-2">
        <Search className="w-4 h-4 text-gray-400" />
        <input type="text" placeholder="이름 또는 이메일 검색" value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none" />
        {search && <button onClick={() => setSearch("")}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
        <span className="text-xs text-gray-400 ml-auto">{filtered.length}명</span>
      </div>

      {/* 테이블 */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/50 bg-white/20">
                  {["이름", "이메일", "역할", "AI 권한", "AI 도구", "사용 / 한도", "온보딩", ""].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">팀원이 없습니다.</td></tr>
                ) : filtered.map(user => (
                  <tr key={user.id} className="border-b border-white/50 hover:bg-white/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px]"
                          style={{ background: "var(--accent)" }}>{user.name[0]}</div>
                        <span className="text-sm font-medium text-gray-800">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={clsx("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        user.role === "team_lead" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600")}>
                        {user.role === "team_lead" ? "팀장" : "Member"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleAi(user)}>
                        {user.ai_enabled ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.ai_tools.map(t => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{AI_TOOL_LABEL[t]}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="text-gray-700 font-medium">${user.ai_used_usd.toFixed(1)}</span>
                      <span className="text-gray-400"> / ${user.ai_quota_usd}</span>
                    </td>
                    <td className="px-4 py-3">
                      {user.onboarding_step !== "complete" && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
                          {ONBOARDING_LABEL[user.onboarding_step]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.role !== "team_lead" && (
                        <button onClick={() => suspendUser(user)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
