"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, AlertTriangle, Star, Target, Zap } from "lucide-react";
import clsx from "clsx";
import { MATURITY_DATA, TEAM_MATURITY } from "@/lib/mockData";

const PRIORITY_STYLE: Record<string, { bg: string; text: string }> = {
  "최우선": { bg: "bg-red-100", text: "text-red-600" },
  "중요":   { bg: "bg-amber-100", text: "text-amber-600" },
  "권장":   { bg: "bg-blue-100", text: "text-blue-600" },
};

export default function MaturityReportPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();

  // Mock: userId에 맞는 데이터 로드 (실제로는 API 호출)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const individual = TEAM_MATURITY.individuals.find((u: any) => u.userId === userId) as any;
  const data = MATURITY_DATA; // 현재는 강지수 데이터 하나만 존재

  if (!individual) {
    return (
      <div className="p-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> 돌아가기
        </button>
        <p className="text-gray-400">성숙도 리포트 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl">
      {/* 헤더 */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> AI 성숙도 목록
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
          style={{ background: "var(--accent)" }}>{individual.name[0]}</div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{individual.name} 성숙도 리포트</h1>
          <p className="text-sm text-gray-500">{individual.team} · {data.period.first} ~ {data.period.second}</p>
        </div>
        <div className="ml-auto">
          <span className="text-sm font-bold px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700">
            {data.level.second}
          </span>
        </div>
      </div>

      {/* 레벨 변화 요약 */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">레벨 변화</h2>
        <div className="flex items-center gap-6 mb-4">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">이전</p>
            <span className="text-lg font-bold px-4 py-2 rounded-xl bg-gray-100 text-gray-600">{data.level.first}</span>
          </div>
          <TrendingUp className="w-6 h-6" style={{ color: "var(--accent)" }} />
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">현재</p>
            <span className="text-lg font-bold px-4 py-2 rounded-xl text-white" style={{ background: "var(--accent)" }}>{data.level.second}</span>
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-gray-700">{data.level.label}</p>
            <p className="text-xs text-gray-500 mt-1">{data.levelChange.second.desc}</p>
          </div>
        </div>

        {/* 변화 근거 */}
        <div className="space-y-2">
          {data.levelChange.evidences.map((e, i) => (
            <div key={i} className="flex items-start gap-2 py-1.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white mt-0.5"
                style={{ background: "var(--accent)" }}>{i + 1}</div>
              <div>
                <p className="text-sm font-medium text-gray-700">{e.title}</p>
                <p className="text-xs text-gray-500">{e.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 스킬 변화 추이 (레이더 차트 대체 — 바 차트) */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">AI Agent 역량 변화</h2>
        <div className="space-y-4">
          {data.skills.map(skill => (
            <div key={skill.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{skill.key}</span>
                <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>{skill.pct}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden relative">
                  <div className="h-full rounded-full bg-gray-300 absolute" style={{ width: `${skill.first}%` }} />
                  <div className="h-full rounded-full absolute" style={{ width: `${skill.second}%`, background: "var(--accent)" }} />
                </div>
                <span className="text-xs text-gray-400 w-16 text-right">{skill.first} → {skill.second}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lv.4 블로커 */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Lv.4 도달 블로커</h2>
        </div>
        <div className="space-y-3">
          {data.levelChange.lv4Blockers.map((b, i) => (
            <div key={i} className="rounded-xl border border-amber-200 bg-amber-50/40 p-3">
              <p className="text-sm font-medium text-gray-800">{b.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SFIA 전환 맵 */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">SFIA 전환 맵 (L3 → L4)</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/50 bg-white/20">
                {["조건", "이전", "현재", "상태", "블로커"].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.sfia.transitionMap.map((row, i) => (
                <tr key={i} className="border-b border-white/30">
                  <td className="px-3 py-2.5 text-xs font-medium text-gray-700">{row.condition}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-500">{row.first}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-700">{row.second}</td>
                  <td className="px-3 py-2.5">
                    <span className={clsx("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      row.statusColor === "red" ? "bg-red-100 text-red-600" :
                      row.statusColor === "indigo" ? "bg-indigo-100 text-indigo-600" : "bg-blue-100 text-blue-600")}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-400">{row.blocker}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 병목 */}
      <div className="glass rounded-2xl p-6 mb-6 border-l-4" style={{ borderLeftColor: "var(--accent)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4" style={{ color: "var(--accent)" }} />
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">핵심 병목</h2>
        </div>
        <p className="text-sm font-bold text-gray-900 mb-1">{data.bottleneck.title}</p>
        <p className="text-xs text-gray-600 mb-2">{data.bottleneck.detail}</p>
        <p className="text-xs text-amber-600 font-medium">{data.bottleneck.warning}</p>
      </div>

      {/* 코칭 권고안 */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">코칭 권고안</h2>
        {data.recommendations.map((rec, i) => {
          const ps = PRIORITY_STYLE[rec.priority] ?? PRIORITY_STYLE["권장"];
          return (
            <div key={i} className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full", ps.bg, ps.text)}>{rec.priority}</span>
                <h3 className="text-sm font-bold text-gray-900">{rec.title}</h3>
                {rec.roi && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-medium ml-auto">{rec.roi}</span>}
              </div>
              <p className="text-xs text-gray-600 mb-3">{rec.why}</p>

              {/* Before → After */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded-lg bg-red-50/50 border border-red-100 p-3">
                  <p className="text-[10px] font-semibold text-red-500 uppercase mb-1">Before</p>
                  <ul className="space-y-1">
                    {rec.before.map((b, j) => <li key={j} className="text-xs text-gray-600">· {b}</li>)}
                  </ul>
                </div>
                <div className="rounded-lg bg-emerald-50/50 border border-emerald-100 p-3">
                  <p className="text-[10px] font-semibold text-emerald-500 uppercase mb-1">After</p>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">{rec.afterTemplate}</pre>
                </div>
              </div>

              {/* 기대 효과 */}
              {rec.effects.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Zap className="w-3 h-3 text-amber-400 mt-0.5" />
                  {rec.effects.map((e, j) => (
                    <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{e}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
