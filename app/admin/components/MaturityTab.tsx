"use client";

import { useState } from "react";
import {
  AlertTriangle, TrendingUp, Target,
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip,
} from "recharts";
import clsx from "clsx";
import { TEAM_MATURITY } from "@/lib/mockData";

const AIMI_SECTIONS = ["Overview", "Individual", "Team", "Organization", "Strategy"] as const;
type AimiSection = typeof AIMI_SECTIONS[number];

const LEVEL_COLOR: Record<string, string> = {
  "Lv.3": "bg-blue-100 text-blue-700",
  "Lv.2~3": "bg-amber-100 text-amber-700",
  "Lv.2": "bg-gray-100 text-gray-600",
};

function GaugeRing({ score }: { score: number }) {
  const max = 100; const r = 54; const cx = 70; const cy = 70;
  const circ = 2 * Math.PI * r;
  const dash = (score / max) * circ;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--accent)" strokeWidth="12"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="28" fontWeight="700" fill="#111827">{Math.round(score)}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="#6b7280">/ 100</text>
    </svg>
  );
}

function MiniBar({ pct, color = "var(--accent)" }: { pct: number; color?: string }) {
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function MaturityTab() {
  const [section, setSection] = useState<AimiSection>("Overview");
  const { overview, individuals, teams, organization, strategy } = TEAM_MATURITY;

  const radarData = [
    { axis: "Prompt 품질" }, { axis: "컨텍스트" }, { axis: "검증" }, { axis: "전략" }, { axis: "재사용" },
  ].map((d, i) => {
    const keys = ["promptQuality", "context", "validation", "strategy", "reuse"] as const;
    const result: Record<string, number | string> = { axis: d.axis };
    teams.forEach(t => { result[t.name] = t.radarScores[keys[i]]; });
    return result;
  });

  return (
    <div className="space-y-5">
      <div className="flex gap-1 glass rounded-xl p-1 w-fit">
        {AIMI_SECTIONS.map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={clsx("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              section === s ? "text-white shadow-sm" : "text-gray-500 hover:bg-white/40")}
            style={section === s ? { background: "var(--accent)" } : {}}>
            {s}
          </button>
        ))}
      </div>

      {section === "Overview" && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-center">
            <div className="flex flex-col items-center gap-1">
              <GaugeRing score={overview.aimiScore} />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AIMI Score</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                Lv.{overview.aimiLevel} {overview.aimiLabel}
              </span>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Quality Score</span><span>{overview.qualityScore}/100</span>
                </div>
                <MiniBar pct={overview.qualityScore} color="var(--accent)" />
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Effectiveness</span><span>{overview.effectiveness}/100</span>
                </div>
                <MiniBar pct={overview.effectiveness} color="#8b5cf6" />
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { label: "총 프롬프트", value: overview.totalPrompts.toLocaleString(), sub: "MONTHLY PROMPTS" },
                  { label: "총 토큰",     value: `${(overview.totalTokens/1000).toFixed(1)}K`, sub: "ESTIMATED TOKENS" },
                  { label: "조직 AI 비용", value: `$${overview.totalCostUsd.toFixed(2)}`, sub: "ESTIMATED USD" },
                ].map(m => (
                  <div key={m.label} className="bg-white/40 rounded-xl p-3">
                    <p className="text-lg font-bold text-gray-900">{m.value}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{m.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "VALIDATION RISK",  value: `${overview.validationRisk}%`, sub: "검증 부재",   color: "text-red-500",    bg: "bg-red-50/60 border-red-100",   icon: <AlertTriangle className="w-5 h-5 text-red-400"/> },
              { label: "LEARNING GAP",     value: `${overview.learningGap}%`,   sub: "재사용 없음",  color: "text-amber-500",  bg: "bg-amber-50/60 border-amber-100", icon: <TrendingUp className="w-5 h-5 text-amber-400"/> },
              { label: "STRATEGIC BIAS",   value: `~${overview.strategicBias}%`, sub: "Design/Test", color: "text-purple-500", bg: "bg-purple-50/60 border-purple-100", icon: <Target className="w-5 h-5 text-purple-400"/> },
            ].map(r => (
              <div key={r.label} className={clsx("rounded-2xl border p-5 flex flex-col gap-2", r.bg)}>
                <div className="flex items-center gap-2">{r.icon}<span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{r.label}</span></div>
                <p className={clsx("text-3xl font-bold", r.color)}>{r.value}</p>
                <p className="text-xs text-gray-400">{r.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === "Individual" && (
        <div className="space-y-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">개인 레벨 활용 품질 및 생산성 리스크 프로파일링</p>
          {individuals.map(u => (
            <div key={u.userId} className="glass rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ background: "var(--accent)" }}>
                    {u.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{u.name}</span>
                      <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium", LEVEL_COLOR[u.level] ?? "bg-gray-100 text-gray-500")}>
                        {u.level} {u.levelLabel}
                      </span>
                      {u.badge && (
                        <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium",
                          u.badge === "팀 챔피언" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-600")}>
                          {u.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{u.team}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold" style={{ color: "var(--accent)" }}>{u.aimiScore}</p>
                  <p className="text-xs text-gray-400">AIMI Score</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Execution",  pct: u.strategyDist.execution, color: "var(--accent)" },
                  { label: "Hybrid",     pct: u.strategyDist.hybrid,    color: "#8b5cf6" },
                  { label: "Decision",   pct: u.strategyDist.decision,  color: "#10b981" },
                ].map(s => (
                  <div key={s.label} className="bg-white/40 rounded-lg p-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">{s.label}</span>
                      <span className="font-semibold text-gray-700">{s.pct}%</span>
                    </div>
                    <MiniBar pct={s.pct} color={s.color} />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 grid grid-cols-5 gap-1">
                  {[
                    { label: "Short", pct: u.shortPromptRate },
                    { label: "Context", pct: u.richContextRate },
                    { label: "Quality", pct: u.qualityIndex },
                    { label: "Effect.", pct: u.effectiveness },
                    { label: "Valid.", pct: u.validationRate },
                  ].map(m => (
                    <div key={m.label} className="text-center">
                      <div className="h-12 bg-gray-100 rounded-lg flex items-end overflow-hidden mx-auto w-7">
                        <div className="w-full rounded-t-sm" style={{ height: `${m.pct}%`, background: "var(--accent)", opacity: 0.6 + (m.pct / 200) }} />
                      </div>
                      <p className="text-[9px] text-gray-400 mt-1 truncate">{m.label}</p>
                    </div>
                  ))}
                </div>
                {u.retryLoopRate > 15 && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center min-w-[90px]">
                    <p className="text-[10px] text-red-400 font-semibold uppercase mb-1">RETRY LOOP</p>
                    <p className="text-xl font-bold text-red-500">{u.retryLoopRate}%</p>
                    <p className="text-[9px] text-red-300">Avg 대비 높음</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {section === "Team" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">AIMI Team Rankings</p>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/50">
                  <th className="text-left text-xs text-gray-400 pb-2 font-medium">팀</th>
                  <th className="text-right text-xs text-gray-400 pb-2 font-medium">Score</th>
                  <th className="text-right text-xs text-gray-400 pb-2 font-medium">Validation</th>
                  <th className="text-left text-xs text-gray-400 pb-2 font-medium pl-3">Team Pulse</th>
                </tr>
              </thead>
              <tbody>
                {[...teams].sort((a,b) => b.score - a.score).map((t, i) => (
                  <tr key={t.name} className="border-b border-white/30">
                    <td className="py-3 flex items-center gap-2">
                      <span className="text-xs text-gray-400">{i+1}</span>
                      <span className="font-semibold text-sm text-gray-800">{t.name}</span>
                    </td>
                    <td className="py-3 text-right font-bold text-sm" style={{ color: t.color }}>{t.score}</td>
                    <td className="py-3 text-right text-sm text-gray-500">{t.validationRate}%</td>
                    <td className="py-3 pl-3 text-xs text-gray-500">{t.pulse}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Multivariate Analysis</p>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                {teams.map(t => (
                  <Radar key={t.name} name={t.name} dataKey={t.name}
                    stroke={t.color} fill={t.color} fillOpacity={0.12} strokeWidth={1.5} />
                ))}
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex gap-3 justify-center mt-2">
              {teams.map(t => (
                <div key={t.name} className="flex items-center gap-1">
                  <div className="w-3 h-1 rounded-full" style={{ background: t.color }} />
                  <span className="text-xs text-gray-500">{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {section === "Organization" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">SDLC Allocation</p>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={organization.sdlcAllocation} dataKey="pct" cx="50%" cy="50%" innerRadius={45} outerRadius={72}>
                    {organization.sdlcAllocation.map(d => <Cell key={d.label} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {organization.sdlcAllocation.map(d => (
                  <div key={d.label} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-xs text-gray-600 flex-1">{d.label}</span>
                    <span className="text-xs font-semibold text-gray-700">{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 bg-gray-800 text-white rounded-xl p-3 text-xs leading-relaxed">
              활용도가 구현(68.4%) 단계에 집중됨. 설계·테스트 비중 높아야 미래 재작업 비용 차단 가능.
            </div>
          </div>
          <div className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Task Intent Analysis (과업 의도)</p>
              <div className="space-y-2">
                {organization.taskIntent.map(t => (
                  <div key={t.label} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-14">{t.label}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${t.pct}%`, background: "var(--accent)" }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-10 text-right">{t.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="glass rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Culture Indicator</p>
                <p className="text-sm font-bold text-gray-800">&apos;{organization.cultureIndicator}&apos;</p>
                <p className="text-xs text-gray-400 mt-1">품질 투자 누적 가능성</p>
              </div>
              <div className="glass rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Smalltalk Rate</p>
                <p className="text-2xl font-bold text-green-500">{organization.smalltalkRate}%</p>
                <p className="text-xs text-gray-400">업무 중심 사용 행태</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {section === "Strategy" && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Intervention Analysis</p>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{strategy.headline}</h3>
            <blockquote className="border-l-4 pl-4 text-sm text-gray-600 leading-relaxed" style={{ borderColor: "var(--accent)" }}>
              &ldquo;{strategy.insight}&rdquo;
            </blockquote>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {strategy.steps.map((s, i) => (
              <div key={s.num} className={clsx("glass rounded-2xl p-5 border-l-4",
                i === 0 ? "border-blue-500" : i === 1 ? "border-purple-400" : i === 2 ? "border-amber-400" : "border-green-400")}>
                <p className="text-2xl font-black text-gray-200 mb-1">{s.num}</p>
                <p className="text-sm font-bold text-gray-800 mb-2">{s.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="glass rounded-2xl p-6 flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">EXPECTED AIMI SCORE</p>
              <p className="text-4xl font-black" style={{ color: "var(--accent)" }}>{strategy.expectedAimi}</p>
              <p className="text-xs text-gray-500 mt-1">{strategy.expectedLevel}</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-gray-500">현재</span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(overview.aimiScore / 100) * 100}%`, background: "#9ca3af" }} />
                </div>
                <span className="text-sm font-bold text-gray-500">{overview.aimiScore}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">목표</span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(strategy.expectedAimi / 100) * 100}%`, background: "var(--accent)" }} />
                </div>
                <span className="text-sm font-bold" style={{ color: "var(--accent)" }}>{strategy.expectedAimi}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">4단계 인터벤션 완료 시 AIMI +{(strategy.expectedAimi - overview.aimiScore).toFixed(1)}점 예상</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
