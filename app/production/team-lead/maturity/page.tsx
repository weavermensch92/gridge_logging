"use client";

import { useMemo } from "react";
import { BarChart3, Award, TrendingUp } from "lucide-react";
import { TEAM_MATURITY } from "@/lib/mockData";

const MY_TEAM_NAME = "개발팀";

export default function TeamLeadMaturity() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const users = useMemo(() => TEAM_MATURITY.individuals.filter((u: any) => u.team === MY_TEAM_NAME), []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avgScore = users.length > 0 ? users.reduce((s: number, u: any) => s + u.aimiScore, 0) / users.length : 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topUser = users.length > 0 ? users.reduce((a: any, b: any) => a.aimiScore > b.aimiScore ? a : b) as any : null;

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">팀 성숙도</h1>
        <p className="text-sm text-gray-500">개발팀 · AIMI 기반 성숙도 평가</p>
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2"><BarChart3 className="w-4 h-4 text-gray-400" /><span className="text-xs font-semibold text-gray-500 uppercase">팀 평균</span></div>
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

      {/* 유저별 성숙도 */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/50">
          <h2 className="text-sm font-semibold text-gray-700">팀원별 성숙도</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/50 bg-white/20">
                {["유저", "AIMI 점수", "레벨", "실행형", "하이브리드", "의사결정", "뱃지"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">성숙도 데이터가 없습니다.</td></tr>
              ) : users.map((u: any) => (
                <tr key={u.userId} className="border-b border-white/50 hover:bg-white/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px]"
                        style={{ background: "var(--accent)" }}>{u.name[0]}</div>
                      <span className="text-sm font-medium text-gray-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${u.aimiScore}%`, background: "var(--accent)" }} />
                      </div>
                      <span className="text-xs font-bold text-gray-700">{u.aimiScore}</span>
                    </div>
                  </td>
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
