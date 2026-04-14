"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, TrendingUp, Award } from "lucide-react";
import clsx from "clsx";
import type { Team } from "@/types";
import { teamsApi } from "@/lib/api";
import { TEAM_MATURITY } from "@/lib/mockData";

export default function AiMaturityPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamFilter, setTeamFilter] = useState("전체");

  const fetchTeams = useCallback(async () => {
    const res = await teamsApi.list();
    if (res.data) setTeams(res.data.teams);
  }, []);
  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allUsers = TEAM_MATURITY.individuals as any[];
  const filtered = useMemo(() =>
    teamFilter === "전체" ? allUsers : allUsers.filter(u => u.team === teamFilter),
    [allUsers, teamFilter]);

  const avgScore = filtered.length > 0 ? filtered.reduce((s, u) => s + u.aimiScore, 0) / filtered.length : 0;
  const topUser = filtered.length > 0 ? filtered.reduce((a, b) => a.aimiScore > b.aimiScore ? a : b) : null;

  // 팀별 성숙도 요약
  const teamSummaries = useMemo(() => teams.map(t => {
    const members = allUsers.filter(u => u.team === t.name);
    const avg = members.length > 0 ? members.reduce((s: number, u: any) => s + u.aimiScore, 0) / members.length : 0;
    const top = members.length > 0 ? members.reduce((a: any, b: any) => a.aimiScore > b.aimiScore ? a : b) : null;
    return { team: t.name, avg, topLevel: top?.levelLabel ?? "-", count: members.length };
  }), [teams, allUsers]);

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI 성숙도</h1>
        <p className="text-sm text-gray-500">AIMI (AI Maturity Index) 기반 성숙도 평가</p>
      </div>

      {/* 팀 필터 */}
      <div className="glass rounded-2xl p-3 mb-4 flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-gray-500 w-8">팀</span>
        {["전체", ...teams.map(t => t.name)].map(t => (
          <button key={t} onClick={() => setTeamFilter(t)}
            className={clsx("text-xs px-3 py-1.5 rounded-full font-medium transition-colors",
              teamFilter === t ? "text-white" : "bg-white/60 text-gray-500 hover:bg-white/80")}
            style={teamFilter === t ? { background: "var(--accent)" } : {}}>
            {t}
          </button>
        ))}
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2"><BarChart3 className="w-4 h-4 text-gray-400" /><span className="text-xs font-semibold text-gray-500 uppercase">평균 AIMI</span></div>
          <p className="text-3xl font-black text-gray-900">{avgScore.toFixed(1)}<span className="text-sm font-normal text-gray-400 ml-1">점</span></p>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2"><Award className="w-4 h-4 text-gray-400" /><span className="text-xs font-semibold text-gray-500 uppercase">최고 성숙도</span></div>
          {topUser ? (
            <><p className="text-xl font-black text-gray-900">{topUser.name}</p><p className="text-xs text-gray-500 mt-0.5">{topUser.levelLabel} · {topUser.aimiScore}점</p></>
          ) : <p className="text-sm text-gray-400">데이터 없음</p>}
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-emerald-400" /><span className="text-xs font-semibold text-gray-500 uppercase">전월 대비</span></div>
          <p className="text-3xl font-black text-emerald-600">+12%</p>
        </div>
      </div>

      {/* 팀별 성숙도 요약 (전체 선택 시만) */}
      {teamFilter === "전체" && teamSummaries.length > 0 && (
        <div className="glass rounded-2xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">팀별 성숙도 레벨</h2>
          <div className="grid grid-cols-3 gap-3">
            {teamSummaries.map(ts => (
              <button key={ts.team} onClick={() => setTeamFilter(ts.team)}
                className="p-3 rounded-xl bg-white/40 hover:bg-white/60 transition-colors text-left">
                <p className="text-sm font-bold text-gray-800 mb-1">{ts.team}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>평균 <b className="text-gray-700">{ts.avg.toFixed(1)}</b></span>
                  <span>최고 <b className="text-gray-700">{ts.topLevel}</b></span>
                  <span>{ts.count}명</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 유저별 테이블 */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/50">
          <h2 className="text-sm font-semibold text-gray-700">유저별 성숙도 현황 · {filtered.length}명</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/50 bg-white/20">
                {["유저", "팀", "AIMI 점수", "레벨", "실행형", "하이브리드", "의사결정", "뱃지"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u: any) => (
                <tr key={u.userId} className="border-b border-white/50 hover:bg-white/20 transition-colors cursor-pointer"
                  onClick={() => router.push(`/production/admin/ai-maturity/${u.userId}`)}>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px]" style={{ background: "var(--accent)" }}>{u.name[0]}</div><span className="text-sm font-medium text-gray-800">{u.name}</span></div></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{u.team}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${u.aimiScore}%`, background: "var(--accent)" }} /></div><span className="text-xs font-bold text-gray-700">{u.aimiScore}</span></div></td>
                  <td className="px-4 py-3"><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{u.levelLabel}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-600">{u.strategyDist.execution}%</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{u.strategyDist.hybrid}%</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{u.strategyDist.decision}%</td>
                  <td className="px-4 py-3 text-xs">{u.badge}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
