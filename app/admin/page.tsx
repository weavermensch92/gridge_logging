"use client";

import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Users, DollarSign, Activity, Clock,
  ChevronDown, ChevronUp, Search, Filter, Calendar, X,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  FileText, FileSpreadsheet, Presentation, FileType2, Database,
  Eye, Download, MessageSquare, Share2, TrendingUp, Layers,
  AlertTriangle, CheckCircle2, Zap, Target, BarChart3,
  ChevronRight as ChevronRightIcon, Network,
} from "lucide-react";

const PeopleMap = lazy(() => import("./PeopleMap"));
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip,
} from "recharts";
import {
  MOCK_LOGS, MOCK_TEAMS, Log,
  SHARED_FILES, SharedFile, FileType, FileStatus,
  TEAM_MATURITY,
} from "@/lib/mockData";
import clsx from "clsx";

const CHANNEL_COLORS: Record<string, string> = {
  anthropic: "bg-orange-100 text-orange-700",
  openai:    "bg-green-100 text-green-700",
  gemini:    "bg-blue-100 text-blue-700",
  extension: "bg-purple-100 text-purple-700",
  crawler:   "bg-gray-100 text-gray-600",
};

const PAGE_SIZE = 20;

// 날짜 프리셋
const DATE_PRESETS = [
  { label: "오늘",    days: 0 },
  { label: "최근 7일", days: 7 },
  { label: "최근 14일", days: 14 },
  { label: "최근 30일", days: 30 },
];

function toDateString(d: Date) {
  return d.toISOString().slice(0, 10);
}

function StatCard({
  icon, label, value, sub,
}: {
  icon: React.ReactNode; label: string; value: string; sub?: string;
}) {
  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function LogRow({ log }: { log: Log }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        className="border-b border-white/50 hover:bg-white/30 cursor-pointer transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{log.user_name}</td>
        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{log.team}</td>
        <td className="px-4 py-3">
          <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full", CHANNEL_COLORS[log.channel])}>
            {log.channel}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{log.model}</td>
        <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{log.prompt}</td>
        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
          {log.input_tokens + log.output_tokens}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
          ${log.cost_usd.toFixed(6)}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
          {log.latency_ms}ms
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
          <td colSpan={10} className="px-6 py-4">
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
          </td>
        </tr>
      )}
    </>
  );
}

// ─── AI 성숙도 대시보드 ──────────────────────────────────────────
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

function MaturityDashboard() {
  const [section, setSection] = useState<AimiSection>("Overview");
  const { overview, individuals, teams, organization, strategy, org } = TEAM_MATURITY;

  // recharts 레이더 데이터
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
      {/* 섹션 탭 */}
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

      {/* ── OVERVIEW ── */}
      {section === "Overview" && (
        <div className="space-y-4">
          {/* 헤더 카드 */}
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
          {/* 리스크 지표 3개 */}
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

      {/* ── INDIVIDUAL ── */}
      {section === "Individual" && (
        <div className="space-y-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">개인 레벨 활용 품질 및 생산성 리스크 프로파일링</p>
          {individuals.map(u => (
            <div key={u.userId} className="glass rounded-2xl p-5 space-y-4">
              {/* 헤더 */}
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
              {/* AI 전략 분포 */}
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
              {/* 인터랙션 지표 + 리트라이 리스크 */}
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

      {/* ── TEAM ── */}
      {section === "Team" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* AIMI 팀 랭킹 */}
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
          {/* 멀티변량 레이더 */}
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

      {/* ── ORGANIZATION ── */}
      {section === "Organization" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* SDLC 분포 도넛 */}
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
          {/* 작업 의도 분석 + 문화 지표 */}
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
                <p className="text-sm font-bold text-gray-800">'{organization.cultureIndicator}'</p>
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

      {/* ── STRATEGY ── */}
      {section === "Strategy" && (
        <div className="space-y-4">
          {/* 인터벤션 헤드라인 */}
          <div className="glass rounded-2xl p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Intervention Analysis</p>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{strategy.headline}</h3>
            <blockquote className="border-l-4 pl-4 text-sm text-gray-600 leading-relaxed" style={{ borderColor: "var(--accent)" }}>
              "{strategy.insight}"
            </blockquote>
          </div>
          {/* 로드맵 스텝 4개 */}
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
          {/* 예상 아웃컴 */}
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

// ─── 공유 파일 대시보드 ─────────────────────────────────────────
const FILE_TYPE_META: Record<FileType, { icon: React.ReactNode; color: string; bg: string }> = {
  PDF:  { icon: <FileText        className="w-4 h-4" />, color: "text-red-600",    bg: "bg-red-50 border-red-200"    },
  XLSX: { icon: <FileSpreadsheet className="w-4 h-4" />, color: "text-green-600",  bg: "bg-green-50 border-green-200"  },
  PPTX: { icon: <Presentation    className="w-4 h-4" />, color: "text-orange-600", bg: "bg-orange-50 border-orange-200"},
  DOCX: { icon: <FileType2       className="w-4 h-4" />, color: "text-blue-600",   bg: "bg-blue-50 border-blue-200"   },
  CSV:  { icon: <Database        className="w-4 h-4" />, color: "text-purple-600", bg: "bg-purple-50 border-purple-200"},
};

const STATUS_BADGE: Record<FileStatus, string> = {
  "공유중": "bg-emerald-100 text-emerald-700",
  "초안":   "bg-amber-100  text-amber-700",
  "만료":   "bg-gray-100   text-gray-500",
};

function FileRow({ file }: { file: SharedFile }) {
  const meta   = FILE_TYPE_META[file.fileType];
  const sharedDate = new Date(file.sharedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
  const updatedDate = new Date(file.updatedAt).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });

  return (
    <tr className="border-b border-white/50 hover:bg-white/30 transition-colors">
      {/* 파일명 + 타입 */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={clsx("p-1.5 rounded-lg border", meta.bg, meta.color)}>{meta.icon}</span>
          <div className="min-w-0">
            <p className="text-sm text-gray-800 font-medium leading-tight truncate max-w-[220px]">{file.title}</p>
            <p className="text-xs text-gray-400">{file.sizeMb} MB</p>
          </div>
        </div>
      </td>
      {/* 유형 */}
      <td className="px-4 py-3">
        <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded-full border", meta.bg, meta.color)}>
          {file.fileType}
        </span>
      </td>
      {/* 생성자 */}
      <td className="px-4 py-3">
        <p className="text-sm text-gray-700 whitespace-nowrap">{file.creator}</p>
        <p className="text-xs text-gray-400">{file.creatorTeam}</p>
      </td>
      {/* 공유 대상 */}
      <td className="px-4 py-3">
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/60 border border-white/80 text-gray-600 whitespace-nowrap">
          {file.sharedTo}
        </span>
      </td>
      {/* 상태 */}
      <td className="px-4 py-3">
        <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full", STATUS_BADGE[file.status])}>
          {file.status}
        </span>
      </td>
      {/* 공유일 */}
      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
        <p>{sharedDate}</p>
        <p className="text-gray-400">업데이트 {updatedDate}</p>
      </td>
      {/* 열람/다운/댓글 */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{file.viewCount}</span>
          <span className="flex items-center gap-1"><Download className="w-3 h-3" />{file.downloadCount}</span>
          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{file.commentCount}</span>
        </div>
      </td>
    </tr>
  );
}

function FileDashboard() {
  const [typeFilter,   setTypeFilter]   = useState<string>("전체");
  const [teamFilter,   setTeamFilter]   = useState<string>("전체");
  const [statusFilter, setStatusFilter] = useState<string>("전체");
  const [search,       setSearch]       = useState("");

  const filtered = useMemo(() => SHARED_FILES.filter(f => {
    if (typeFilter   !== "전체" && f.fileType    !== typeFilter)   return false;
    if (teamFilter   !== "전체" && f.sharedTo    !== teamFilter && f.creatorTeam !== teamFilter) return false;
    if (statusFilter !== "전체" && f.status      !== statusFilter) return false;
    if (search && !f.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [typeFilter, teamFilter, statusFilter, search]);

  // 통계 (전체 기준)
  const stats = useMemo(() => {
    const total     = SHARED_FILES.length;
    const thisMonth = SHARED_FILES.filter(f => f.createdAt >= "2026-03-01").length;
    const totalViews = SHARED_FILES.reduce((s, f) => s + f.viewCount, 0);
    const totalDl    = SHARED_FILES.reduce((s, f) => s + f.downloadCount, 0);
    return { total, thisMonth, totalViews, totalDl };
  }, []);

  // 유형별 분포
  const typeCount = useMemo(() => {
    const m: Record<string, number> = {};
    SHARED_FILES.forEach(f => { m[f.fileType] = (m[f.fileType] ?? 0) + 1; });
    return m;
  }, []);

  const maxCount = Math.max(...Object.values(typeCount));

  const FILE_TYPES: FileType[] = ["PDF", "XLSX", "PPTX", "DOCX", "CSV"];

  return (
    <div className="space-y-5">
      {/* 통계 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: <Layers className="w-4 h-4"/>,     label: "총 공유 파일",  value: `${stats.total}개` },
          { icon: <Share2 className="w-4 h-4"/>,     label: "이번 달 신규",  value: `${stats.thisMonth}개` },
          { icon: <Eye className="w-4 h-4"/>,        label: "누적 열람",     value: stats.totalViews.toLocaleString() },
          { icon: <Download className="w-4 h-4"/>,   label: "누적 다운로드", value: stats.totalDl.toLocaleString() },
        ].map(({ icon, label, value }) => (
          <div key={label} className="glass rounded-2xl p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-400 text-sm">{icon}<span>{label}</span></div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* 유형별 분포 */}
      <div className="glass rounded-2xl p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase mb-4 tracking-wider">파일 유형별 분포</p>
        <div className="flex items-end gap-4">
          {FILE_TYPES.map(type => {
            const count = typeCount[type] ?? 0;
            const meta  = FILE_TYPE_META[type];
            const pct   = Math.round((count / maxCount) * 100);
            return (
              <div key={type} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-sm font-bold text-gray-700">{count}</span>
                <div className="w-full rounded-t-lg" style={{ height: `${Math.max(8, pct * 0.8)}px`, background: "var(--accent)", opacity: 0.15 + (pct / 100) * 0.85 }} />
                <div className={clsx("p-1.5 rounded-lg border", meta.bg, meta.color)}>{meta.icon}</div>
                <span className="text-xs text-gray-500 font-medium">{type}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 필터 + 테이블 */}
      <div className="glass rounded-2xl overflow-hidden">
        {/* 필터 바 */}
        <div className="px-5 pt-4 pb-3 border-b border-white/50 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            {/* 검색 */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="파일명 검색..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-white/50 border border-white/60 focus:outline-none focus:ring-2 focus:ring-blue-200 placeholder:text-gray-400"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>

            {/* 유형 필터 */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {["전체", ...FILE_TYPES].map(t => {
                const meta = t !== "전체" ? FILE_TYPE_META[t as FileType] : null;
                return (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={clsx(
                      "text-xs px-2.5 py-1 rounded-full transition-colors border flex items-center gap-1",
                      typeFilter === t
                        ? "text-white border-transparent"
                        : meta
                          ? clsx("border-transparent", meta.bg, meta.color)
                          : "bg-white/40 border-white/60 text-gray-500 hover:bg-white/60"
                    )}
                    style={typeFilter === t ? { background: "var(--accent)" } : {}}
                  >
                    {meta && <span className={typeFilter === t ? "text-white" : meta.color}>{meta.icon}</span>}
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* 공유 대상 */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">대상</span>
              {["전체", "전체(공유대상)", "개발팀", "디자인팀", "기획팀"].map(t => {
                const label = t === "전체(공유대상)" ? "전사공유" : t;
                const val   = t === "전체(공유대상)" ? "전체" : t;
                return (
                  <button
                    key={t}
                    onClick={() => setTeamFilter(val)}
                    className={clsx(
                      "text-xs px-2.5 py-1 rounded-full transition-colors border",
                      teamFilter === val && t !== "전체"
                        ? "text-white border-transparent"
                        : teamFilter === val
                        ? "text-white border-transparent"
                        : "bg-white/40 border-white/60 text-gray-500 hover:bg-white/60"
                    )}
                    style={(teamFilter === val) ? { background: "var(--accent)" } : {}}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* 상태 필터 */}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-xs text-gray-400">상태</span>
              {(["전체", "공유중", "초안", "만료"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={clsx(
                    "text-xs px-2.5 py-1 rounded-full transition-colors border",
                    statusFilter === s
                      ? "text-white border-transparent"
                      : "bg-white/40 border-white/60 text-gray-500 hover:bg-white/60"
                  )}
                  style={statusFilter === s ? { background: "var(--accent)" } : {}}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/50 bg-white/20">
                {["파일명", "유형", "생성자", "공유 대상", "상태", "공유일", "활동"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0
                ? filtered.map(f => <FileRow key={f.id} file={f} />)
                : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                      조건에 맞는 파일이 없습니다
                    </td>
                  </tr>
                )
              }
            </tbody>
          </table>
        </div>

        {/* 푸터 */}
        <div className="px-5 py-3 border-t border-white/50">
          <p className="text-xs text-gray-400">{filtered.length}개 표시 · 전체 {SHARED_FILES.length}개</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"logs" | "maturity" | "files" | "people">("logs");
  const [teamFilter, setTeamFilter] = useState<string>("전체");
  const [channelFilter, setChannelFilter] = useState<string>("전체");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activePreset, setActivePreset] = useState<string>("");
  const [page, setPage] = useState(1);

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

  const filtered = useMemo(() => MOCK_LOGS.filter(l => {
    if (teamFilter !== "전체" && l.team !== teamFilter) return false;
    if (channelFilter !== "전체" && l.channel !== channelFilter) return false;
    if (search && !l.prompt.toLowerCase().includes(search.toLowerCase()) && !l.user_name.includes(search)) return false;
    if (dateFrom) {
      const logDate = l.timestamp.slice(0, 10);
      if (logDate < dateFrom) return false;
    }
    if (dateTo) {
      const logDate = l.timestamp.slice(0, 10);
      if (logDate > dateTo) return false;
    }
    return true;
  }), [teamFilter, channelFilter, search, dateFrom, dateTo]);

  // 필터된 결과 기준 통계
  const filteredStats = useMemo(() => ({
    totalLogs: filtered.length,
    totalCost: filtered.reduce((s, l) => s + l.cost_usd, 0),
    activeUsers: new Set(filtered.map(l => l.user_id)).size,
    avgLatency: filtered.length > 0
      ? Math.round(filtered.reduce((s, l) => s + l.latency_ms, 0) / filtered.length)
      : 0,
  }), [filtered]);

  // 필터 변경 시 페이지 초기화
  useEffect(() => { setPage(1); }, [teamFilter, channelFilter, search, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  // 페이지 번호 범위 계산 (최대 5개)
  function getPageNumbers() {
    const delta = 2;
    const range: number[] = [];
    const left = Math.max(1, page - delta);
    const right = Math.min(totalPages, page + delta);
    for (let i = left; i <= right; i++) range.push(i);
    return range;
  }

  const hasDateFilter = dateFrom || dateTo;

  return (
    <main
      className="min-h-screen p-6"
      style={{ background: "var(--bg-base)" }}
    >
      {/* 배경 장식 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div
          className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
          style={{ background: "var(--accent)" }}
        />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="p-2 rounded-xl glass hover:scale-105 transition-transform"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">팀 AI 대시보드</h1>
              <p className="text-sm text-gray-500">Softsquared Inc. · Admin: 김태영</p>
            </div>
          </div>
        </div>

        {/* 탭 스위처 */}
        <div className="flex gap-1 glass rounded-xl p-1 mb-6 w-fit">
          {([
            { key: "logs",     label: "AI 로그",    icon: <Activity   className="w-4 h-4" /> },
            { key: "maturity", label: "AI 성숙도",   icon: <BarChart3  className="w-4 h-4" /> },
            { key: "files",    label: "공유 파일",   icon: <Share2     className="w-4 h-4" /> },
            { key: "people",   label: "인맥도",      icon: <Network    className="w-4 h-4" /> },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.key
                  ? "text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
              )}
              style={activeTab === tab.key ? { background: "var(--accent)" } : {}}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── 탭 콘텐츠 ── */}
        {activeTab === "maturity" && <MaturityDashboard />}
        {activeTab === "files" && <FileDashboard />}
        {activeTab === "people" && (
          <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-400 text-sm">인맥도 로딩 중...</div>}>
            <PeopleMap />
          </Suspense>
        )}

        {/* ── AI 로그 탭 ── */}
        {activeTab === "logs" && <>

        {/* 통계 카드 — 필터 결과 반영 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<Activity className="w-4 h-4" />}
            label="조회 로그"
            value={`${filteredStats.totalLogs}건`}
            sub={`전체 ${MOCK_LOGS.length}건`}
          />
          <StatCard
            icon={<DollarSign className="w-4 h-4" />}
            label="총 비용"
            value={`$${filteredStats.totalCost.toFixed(5)}`}
            sub="조회 구간"
          />
          <StatCard
            icon={<Users className="w-4 h-4" />}
            label="활성 유저"
            value={`${filteredStats.activeUsers}명`}
          />
          <StatCard
            icon={<Clock className="w-4 h-4" />}
            label="평균 응답시간"
            value={`${filteredStats.avgLatency}ms`}
          />
        </div>

        {/* 날짜 필터 */}
        <div className="glass rounded-2xl p-4 mb-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium text-gray-600">날짜</span>
          </div>

          {/* 프리셋 버튼 */}
          <div className="flex gap-2">
            {DATE_PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.days, p.label)}
                className={clsx(
                  "text-xs px-3 py-1.5 rounded-full font-medium transition-colors",
                  activePreset === p.label
                    ? "text-white"
                    : "bg-white/60 text-gray-500 hover:bg-white/80"
                )}
                style={activePreset === p.label ? { background: "var(--accent)" } : {}}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-200 hidden sm:block" />

          {/* 직접 입력 */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setActivePreset(""); }}
              className="text-xs bg-white/60 border border-white/80 rounded-lg px-2 py-1.5 text-gray-600 outline-none focus:ring-1 cursor-pointer"
              style={{ colorScheme: "light" }}
            />
            <span className="text-gray-400 text-xs">~</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setActivePreset(""); }}
              className="text-xs bg-white/60 border border-white/80 rounded-lg px-2 py-1.5 text-gray-600 outline-none focus:ring-1 cursor-pointer"
              style={{ colorScheme: "light" }}
            />
            {hasDateFilter && (
              <button
                onClick={clearDates}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 bg-white/60 px-2 py-1.5 rounded-lg transition-colors"
              >
                <X className="w-3 h-3" />
                초기화
              </button>
            )}
          </div>
        </div>

        {/* 팀/채널 필터 + 검색 */}
        <div className="glass rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-gray-400">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium text-gray-600">필터</span>
          </div>

          {/* 팀 필터 */}
          <div className="flex gap-2">
            {["전체", ...MOCK_TEAMS].map(t => (
              <button
                key={t}
                onClick={() => setTeamFilter(t)}
                className={clsx(
                  "text-xs px-3 py-1.5 rounded-full font-medium transition-colors",
                  teamFilter === t
                    ? "text-white"
                    : "bg-white/60 text-gray-500 hover:bg-white/80"
                )}
                style={teamFilter === t ? { background: "var(--accent)" } : {}}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-200 hidden sm:block" />

          {/* 채널 필터 */}
          <div className="flex gap-2 flex-wrap">
            {["전체", "anthropic", "openai", "gemini", "extension", "crawler"].map(c => (
              <button
                key={c}
                onClick={() => setChannelFilter(c)}
                className={clsx(
                  "text-xs px-3 py-1.5 rounded-full font-medium transition-colors",
                  channelFilter === c
                    ? "text-white"
                    : "bg-white/60 text-gray-500 hover:bg-white/80"
                )}
                style={channelFilter === c ? { background: "var(--accent)" } : {}}
              >
                {c}
              </button>
            ))}
          </div>

          {/* 검색 */}
          <div className="ml-auto flex items-center gap-2 bg-white/60 rounded-xl px-3 py-1.5">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="유저명 또는 프롬프트 검색"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-48"
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* 로그 테이블 */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/50 bg-white/20">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">유저</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">팀</th>
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
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Calendar className="w-8 h-8 opacity-40" />
                        <p className="text-sm">조건에 맞는 로그가 없습니다</p>
                        {hasDateFilter && (
                          <button
                            onClick={clearDates}
                            className="text-xs mt-1 underline hover:text-gray-600"
                          >
                            날짜 필터 초기화
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map(log => <LogRow key={log.id} log={log} />)
                )}
              </tbody>
            </table>
          </div>
          {/* 페이지네이션 */}
          <div className="px-4 py-3 border-t border-white/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* 범위 표시 */}
            <p className="text-xs text-gray-400 shrink-0">
              {filtered.length === 0 ? "0건" : (
                <>
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}
                  {" "}/ {filtered.length}건
                  {filtered.length < MOCK_LOGS.length && ` (전체 ${MOCK_LOGS.length}건)`}
                </>
              )}
            </p>

            {/* 페이지 버튼 */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                {/* 첫 페이지 */}
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsLeft className="w-3.5 h-3.5 text-gray-500" />
                </button>
                {/* 이전 */}
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
                </button>

                {/* 왼쪽 생략 */}
                {getPageNumbers()[0] > 1 && (
                  <>
                    <button
                      onClick={() => setPage(1)}
                      className="w-7 h-7 text-xs rounded-lg hover:bg-white/60 text-gray-500 transition-colors"
                    >1</button>
                    {getPageNumbers()[0] > 2 && (
                      <span className="text-gray-300 text-xs px-0.5">…</span>
                    )}
                  </>
                )}

                {/* 번호 */}
                {getPageNumbers().map(n => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={clsx(
                      "w-7 h-7 text-xs rounded-lg font-medium transition-colors",
                      n === page
                        ? "text-white"
                        : "hover:bg-white/60 text-gray-500"
                    )}
                    style={n === page ? { background: "var(--accent)" } : {}}
                  >
                    {n}
                  </button>
                ))}

                {/* 오른쪽 생략 */}
                {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                  <>
                    {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
                      <span className="text-gray-300 text-xs px-0.5">…</span>
                    )}
                    <button
                      onClick={() => setPage(totalPages)}
                      className="w-7 h-7 text-xs rounded-lg hover:bg-white/60 text-gray-500 transition-colors"
                    >{totalPages}</button>
                  </>
                )}

                {/* 다음 */}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                </button>
                {/* 마지막 페이지 */}
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsRight className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>
            )}

            {/* 전체 초기화 */}
            {(hasDateFilter || teamFilter !== "전체" || channelFilter !== "전체" || search) && (
              <button
                onClick={() => { clearDates(); setTeamFilter("전체"); setChannelFilter("전체"); setSearch(""); }}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 shrink-0"
              >
                <X className="w-3 h-3" /> 전체 초기화
              </button>
            )}
          </div>
        </div>
        </> /* AI 로그 탭 끝 */}
      </div>
    </main>
  );
}
