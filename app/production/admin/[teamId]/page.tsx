"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Users, DollarSign, Loader2, UserPlus,
  ToggleLeft, ToggleRight, Edit3, Trash2,
} from "lucide-react";
import clsx from "clsx";
import type { User, Team, AiToolType } from "@/types";
import { usersApi, teamsApi } from "@/lib/api";

const AI_TOOL_LABEL: Record<AiToolType, string> = {
  chatgpt: "ChatGPT", claude_web: "Claude 웹", gemini_web: "Gemini 웹",
  claude_code: "Claude Code", cursor: "Cursor",
};

const ONBOARDING_LABEL: Record<string, string> = {
  password_change: "비밀번호 변경 대기", tool_install: "도구 설치 중", complete: "",
};

export default function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [teamRes, userRes] = await Promise.all([
      teamsApi.list(),
      usersApi.list({ team_id: teamId }),
    ]);
    if (teamRes.data) {
      const found = teamRes.data.teams.find(t => t.id === teamId);
      setTeam(found ?? null);
    }
    if (userRes.data) setMembers(userRes.data.users);
    setLoading(false);
  }, [teamId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleAi = async (user: User) => {
    await usersApi.update(user.id, { ai_enabled: !user.ai_enabled });
    fetchData();
  };

  const suspendUser = async (user: User) => {
    if (!confirm(`${user.name}님을 비활성화하시겠습니까?`)) return;
    await usersApi.remove(user.id);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!team) {
    return <div className="p-6"><p className="text-gray-400">팀을 찾을 수 없습니다.</p></div>;
  }

  const totalCost = members.reduce((s, m) => s + m.ai_used_usd, 0);

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
        <p className="text-sm text-gray-500">팀 멤버 관리 · AI 사용 현황</p>
      </div>

      {/* 팀 통계 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">멤버</span>
          </div>
          <p className="text-3xl font-black text-gray-900">{members.length}<span className="text-sm font-normal text-gray-400 ml-1">명</span></p>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">이번달 비용</span>
          </div>
          <p className="text-3xl font-black text-gray-900">${totalCost.toFixed(1)}</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">팀 예산</span>
          </div>
          <p className="text-3xl font-black text-gray-900">{team.ai_budget_usd ? `$${team.ai_budget_usd}` : "무제한"}</p>
        </div>
      </div>

      {/* 멤버 테이블 */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">팀 멤버</h2>
          <button onClick={() => router.push("/production/admin/users")}
            className="flex items-center gap-1 text-xs font-medium hover:opacity-80"
            style={{ color: "var(--accent)" }}>
            <UserPlus className="w-3.5 h-3.5" /> 유저 관리에서 추가
          </button>
        </div>
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
              {members.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">멤버가 없습니다.</td></tr>
              ) : members.map(user => (
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
                      user.role === "admin" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600")}>
                      {user.role === "admin" ? "Admin" : "Member"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleAi(user)}>
                      {user.ai_enabled
                        ? <ToggleRight className="w-6 h-6 text-green-500" />
                        : <ToggleLeft className="w-6 h-6 text-gray-300" />}
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
                    <button onClick={() => suspendUser(user)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
