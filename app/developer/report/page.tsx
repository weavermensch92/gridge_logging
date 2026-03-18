"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft, TrendingUp,
  AlertCircle, AlertTriangle, ChevronRight, BarChart3,
  Zap, Target, Shield, Users, CheckCircle2,
} from "lucide-react";
import { MATURITY_DATA } from "@/lib/mockData";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Legend, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import clsx from "clsx";

const d = MATURITY_DATA;

// ── 헬퍼 ────────────────────────────────────────────
function SectionBadge({ n }: { n: number }) {
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-white text-sm font-bold mr-3 shrink-0"
      style={{ background: "var(--accent)" }}
    >
      {n}
    </span>
  );
}
function SectionTitle({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center mb-6">
      <SectionBadge n={n} />
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    </div>
  );
}

const PRIORITY_STYLES: Record<string, { border: string; tag: string }> = {
  최우선: { border: "border-l-4 border-red-400 bg-red-50/60",    tag: "bg-red-100 text-red-700 border-red-200" },
  중요:   { border: "border-l-4 border-amber-400 bg-amber-50/60", tag: "bg-amber-100 text-amber-700 border-amber-200" },
  권장:   { border: "border-l-4 border-blue-400 bg-blue-50/60",   tag: "bg-blue-100 text-blue-700 border-blue-200" },
};

const STATUS_COLORS: Record<string, string> = {
  "L3 안정화":      "bg-blue-100 text-blue-700",
  "L3 상단":        "bg-blue-100 text-blue-700",
  "L3 (전환 직전)": "bg-indigo-100 text-indigo-700",
  "L3 한계":        "bg-blue-100 text-blue-700",
  "미충족":         "bg-red-100 text-red-700",
};

const EFFECT_BG = ["#065f46", "#92400e", "#1e3a5f"];

// ── 다크 레이더 차트 ────────────────────────────────
function DarkRadar() {
  const radarData = d.skills.map(s => ({
    subject: s.key,
    "1차 (11/22)": s.first,
    "2차 (12/20)": s.second,
  }));
  return (
    <div className="rounded-2xl p-6" style={{ background: "#1a1f3a" }}>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#94a3b8" }} />
          <Radar name="1차 (11/22)" dataKey="1차 (11/22)" stroke="#64748b" fill="#64748b" fillOpacity={0.25} />
          <Radar name="2차 (12/20)" dataKey="2차 (12/20)" stroke="#6366f1" fill="#6366f1" fillOpacity={0.35} />
          <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── 라인 차트 ────────────────────────────────────────
function TrendLineChart() {
  const data = d.skills.map(s => ({ name: s.key, "1차": s.first, "2차": s.second }));
  return (
    <div className="rounded-2xl p-6" style={{ background: "#1a1f3a" }}>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ left: -10, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#64748b" }} interval={0} angle={-10} textAnchor="end" height={45} />
          <YAxis domain={[30, 90]} tick={{ fontSize: 10, fill: "#64748b" }} />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
            labelStyle={{ color: "#94a3b8" }}
          />
          <Line type="monotone" dataKey="1차" stroke="#64748b" strokeWidth={2} dot={{ r: 4, fill: "#64748b" }} />
          <Line type="monotone" dataKey="2차" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 5, fill: "#6366f1" }} />
          <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ══════════════════════════════════════════════════════
export default function ReportPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen p-6" style={{ background: "var(--bg-base)" }}>
      {/* 배경 장식 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl" style={{ background: "var(--accent)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-5 blur-3xl" style={{ background: "#10B981" }} />
      </div>

      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── 헤더 ───────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/developer")} className="p-2 rounded-xl glass hover:scale-105 transition-transform">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" style={{ color: "var(--accent)" }} />
              <h1 className="text-2xl font-bold text-gray-900">AI Agent 활용 성숙도 진단 리포트</h1>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {d.user.project} · {d.user.id} ({d.user.name}) · {d.period.first} → {d.period.second}
              <span className="ml-2 text-xs text-gray-400">Confidential Report · Gridge Consulting</span>
            </p>
          </div>
        </div>

        {/* ── 0. 변화 요약 ────────────────────────────────── */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center mb-5">
            <SectionBadge n={0} />
            <h2 className="text-xl font-bold text-gray-900">변화 요약</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 활용 성숙도 */}
            <div className="rounded-xl border border-white/60 bg-white/30 p-5">
              <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-gray-500">
                <TrendingUp className="w-3.5 h-3.5" /> 활용 성숙도
              </div>
              <p className="text-xs text-gray-400 mb-0.5">1차</p>
              <p className="text-lg font-bold text-gray-500 mb-1">{d.changeSummary.maturity.firstLabel}</p>
              <p className="text-xs text-gray-400 mb-3">{d.changeSummary.maturity.firstSub}</p>
              <div className="rounded-lg px-3 py-3 text-white text-center" style={{ background: "var(--accent)" }}>
                <p className="text-xs opacity-80 mb-0.5">2차</p>
                <p className="text-xl font-bold">{d.changeSummary.maturity.secondLabel}</p>
                <p className="text-xs opacity-80">{d.changeSummary.maturity.secondSub}</p>
              </div>
            </div>

            {/* 정량 규모 */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
              <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-gray-500">
                <BarChart3 className="w-3.5 h-3.5" /> 정량 규모
              </div>
              <p className="text-xs text-gray-400 mb-0.5">1차</p>
              <p className="text-lg font-bold text-gray-500 mb-0.5">{d.changeSummary.scale.firstLabel}</p>
              <p className="text-xs text-gray-400 mb-3">{d.changeSummary.scale.firstSub}</p>
              <div className="rounded-lg px-3 py-3 bg-emerald-500 text-white text-center">
                <p className="text-xs opacity-80 mb-0.5">2차</p>
                <p className="text-sm font-bold whitespace-pre-line leading-snug">{d.changeSummary.scale.secondLabel}</p>
                <p className="text-xs opacity-80 mt-0.5">{d.changeSummary.scale.secondSub}</p>
              </div>
            </div>

            {/* 핵심 병목 이동 */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
              <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-gray-500">
                <AlertTriangle className="w-3.5 h-3.5" /> 핵심 병목 이동
              </div>
              <p className="text-xs text-gray-400 mb-0.5">1차 병목</p>
              <p className="text-base font-bold text-gray-600 mb-0.5">{d.changeSummary.bottleneck.firstLabel}</p>
              <p className="text-xs text-gray-400 mb-3">{d.changeSummary.bottleneck.firstSub}</p>
              <div className="rounded-lg px-3 py-3 bg-orange-500 text-white text-center">
                <p className="text-xs opacity-80 mb-0.5">2차 병목</p>
                <p className="text-base font-bold">{d.changeSummary.bottleneck.secondLabel}</p>
                <p className="text-xs opacity-80">{d.changeSummary.bottleneck.secondSub}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 1. AI Agent 역량 변화 추이 ─────────────────── */}
        <div className="glass rounded-2xl p-6">
          <SectionTitle n={1} title="AI Agent 활용 역량 변화 추이" />
          <TrendLineChart />

          {/* 역량별 상세 카드 */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-5 mb-3">역량별 상세 변화</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {d.skills.map((s, i) => (
              <div key={i} className="bg-white/40 rounded-xl p-3 text-center">
                <span className="text-xs font-bold text-green-600 bg-green-100 rounded-full px-2 py-0.5 inline-block mb-2">+20</span>
                <p className="text-xs text-gray-500 mb-2 leading-tight">{s.key}</p>
                <div className="space-y-1.5">
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-0.5"><span>1차</span><span>{s.first}</span></div>
                    <div className="h-1.5 rounded-full bg-gray-200">
                      <div className="h-full rounded-full bg-gray-400" style={{ width: `${s.first}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-0.5" style={{ color: "var(--accent)" }}><span>2차</span><span>{s.second}</span></div>
                    <div className="h-1.5 rounded-full bg-gray-200">
                      <div className="h-full rounded-full" style={{ width: `${s.second}%`, background: "var(--accent)" }} />
                    </div>
                  </div>
                </div>
                <p className="text-xs font-bold text-green-600 mt-1.5">{s.pct}</p>
              </div>
            ))}
          </div>

          {/* 가장 큰 향상 / 지속 개선 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> 가장 큰 향상
              </div>
              {d.skillHighlights.topGain.map((h, i) => (
                <p key={i} className="text-xs text-gray-600 mb-1">
                  <strong className="text-emerald-700">{h.key}</strong> {h.detail}
                </p>
              ))}
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
              <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-blue-700">
                <TrendingUp className="w-3.5 h-3.5" /> 지속 개선 영역
              </div>
              {d.skillHighlights.continuous.map((h, i) => (
                <p key={i} className="text-xs text-gray-600 mb-1">
                  <strong className="text-blue-700">{h.key}</strong> {h.detail}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* ── 2. 역량 프로필 비교 (Radar) ────────────────── */}
        <div className="glass rounded-2xl p-6">
          <SectionTitle n={2} title="역량 프로필 비교 (Radar Chart)" />
          <DarkRadar />
          <div className="mt-4 rounded-xl border-l-4 border-indigo-400 bg-indigo-50/50 p-4">
            <p className="text-xs font-semibold text-indigo-700 mb-1">해석</p>
            <p className="text-sm text-gray-700">
              모든 역량 축에서 <strong>일관된 상승세(평균 +20점)</strong>를 보이며, 특히 Problem Framing과 Prompt Engineering이 강화되어
              <strong>"설계 중심(Architect)" 패턴으로의 전환</strong>이 뚜렷이 관측됩니다.
            </p>
          </div>
        </div>

        {/* ── 3. 개발 활동 정량 지표 ─────────────────────── */}
        <div className="glass rounded-2xl p-6">
          <SectionTitle n={3} title="개발 활동 정량 지표 변화" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/50 bg-white/20">
                  {["항목", "1차 (11/22)", "2차 (12/20)", "변화", "시스템적 의미"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.metrics.map((m, i) => (
                  <tr key={i} className="border-b border-white/40 hover:bg-white/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{m.label}</td>
                    <td className="px-4 py-3 text-gray-500">{m.first}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: "var(--accent)" }}>{m.secondFull}</td>
                    <td className="px-4 py-3">
                      <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-full", m.badgeColor === "green" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700")}>
                        +{m.badge}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-xs">{m.systemMeaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-xl border-l-4 border-emerald-400 bg-emerald-50/50 p-4">
            <p className="text-xs font-semibold text-emerald-700 mb-1">해석</p>
            <p className="text-sm text-gray-700">
              1차는 로그 기반 산출물 중심이었으나, 2차에서는 <strong>AI 작업 58회 / 파일 1,989개 / 평균 622초</strong>로 대규모 활용이 수치로 확인됩니다.
              AI를 단발성 도구가 아니라 <strong>상시 개발 흐름에 삽입</strong>한 형태입니다.
            </p>
          </div>
        </div>

        {/* ── 4. 작업 수행 방식 변화 ─────────────────────── */}
        <div className="glass rounded-2xl p-6">
          <SectionTitle n={4} title="작업 수행 방식 변화 분석" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white/40 p-5">
              <span className="inline-block text-xs font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-600 mb-3">1차</span>
              <p className="font-bold text-gray-800 mb-3">{d.workStyleChange.first.title}</p>
              {d.workStyleChange.first.positives.map((t, i) => (
                <div key={i} className="flex items-start gap-2 mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-xs text-gray-600">{t}</span>
                </div>
              ))}
              {d.workStyleChange.first.negatives.map((t, i) => (
                <div key={i} className="flex items-start gap-2 mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-amber-700">{t}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-5">
              <span className="inline-block text-xs font-bold px-2 py-0.5 rounded text-white mb-3" style={{ background: "var(--accent)" }}>2차</span>
              <p className="font-bold text-gray-800 mb-3">{d.workStyleChange.second.title}</p>
              {d.workStyleChange.second.positives.map((t, i) => (
                <div key={i} className="flex items-start gap-2 mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-gray-700">{t}</span>
                </div>
              ))}
              {d.workStyleChange.second.warnings.map((t, i) => (
                <div key={i} className="flex items-start gap-2 mb-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-orange-700 font-medium">{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-xl border-l-4 border-indigo-400 bg-indigo-50/50 p-4">
            <p className="text-xs font-semibold text-indigo-700 mb-1">결론</p>
            <p className="text-sm text-gray-700">{d.workStyleChange.conclusion}</p>
          </div>
        </div>

        {/* ── 5. 레벨 변화 판정 ──────────────────────────── */}
        <div className="glass rounded-2xl p-6">
          <SectionTitle n={5} title='"레벨 변화"에 대한 판정 (Level Change Focus)' />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="rounded-xl border border-gray-200 bg-white/40 p-5">
              <span className="inline-block text-xs font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-600 mb-2">1차</span>
              <p className="text-lg font-bold text-gray-600 mb-2">{d.levelChange.first.level}</p>
              <p className="text-xs text-gray-500">{d.levelChange.first.desc}</p>
            </div>
            <div className="rounded-xl border border-indigo-300 p-5 text-white" style={{ background: "var(--accent)" }}>
              <span className="inline-block text-xs font-bold px-2 py-0.5 rounded bg-white/20 mb-2">2차</span>
              <p className="text-lg font-bold mb-2">{d.levelChange.second.level}</p>
              <p className="text-xs opacity-80">{d.levelChange.second.desc}</p>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <p className="text-sm font-bold text-emerald-700">Lv.2 → Lv.3 전환의 증거</p>
            </div>
            <div className="space-y-2">
              {d.levelChange.evidences.map((e, i) => (
                <div key={i} className="bg-white/60 rounded-lg p-3">
                  <p className="text-xs font-bold text-gray-700 mb-0.5">{e.title}</p>
                  <p className="text-xs text-gray-500">{e.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <p className="text-sm font-bold text-amber-700">Lv.4에 미도달한 이유</p>
            </div>
            <div className="space-y-2">
              {d.levelChange.lv4Blockers.map((b, i) => (
                <div key={i} className="bg-white/60 rounded-lg p-3">
                  <p className="text-xs font-bold text-gray-700 mb-0.5">{b.title}</p>
                  <p className="text-xs text-gray-500">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 6. SFIA 책임수준 기반 판정 ─────────────────── */}
        <div className="glass rounded-2xl p-6">
          <SectionTitle n={6} title="SFIA 책임수준 기반 판정 (Level 3–4)" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-lg bg-blue-500 text-white text-sm font-bold flex items-center justify-center">L3</span>
                <span className="text-sm font-bold text-blue-700">{d.sfia.l3.label}</span>
              </div>
              {d.sfia.l3.items.map((item, i) => (
                <div key={i} className="flex items-start gap-2 mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-gray-600">{item}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-purple-200 p-5 text-white" style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-lg bg-white/20 text-white text-sm font-bold flex items-center justify-center">L4</span>
                <span className="text-sm font-bold">{d.sfia.l4.label}</span>
              </div>
              {d.sfia.l4.items.map((item, i) => (
                <div key={i} className="flex items-start gap-2 mb-1.5">
                  <Target className="w-3.5 h-3.5 opacity-80 mt-0.5 shrink-0" />
                  <span className="text-xs opacity-90">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-indigo-900 p-5 mb-5 text-white">
            <p className="text-xs font-semibold text-indigo-300 mb-2">Level 4 진입 조건</p>
            {d.sfia.l4Conditions.map((c, i) => (
              <div key={i} className="flex items-start gap-2 mb-1">
                <ChevronRight className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                <span className="text-xs text-indigo-100">{c}</span>
              </div>
            ))}
          </div>

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">SFIA Level 3 → Level 4 전환 조건 매핑</p>
          <div className="overflow-x-auto rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "var(--accent)" }} className="text-white">
                  {["SFIA 전환 조건 (L3→L4)", "1차 상태", "2차 변화", "현재 판단", "전환을 막는 요인"].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.sfia.transitionMap.map((row, i) => (
                  <tr key={i} className={clsx("border-b border-white/30", i % 2 === 0 ? "bg-white/30" : "bg-white/10", row.status === "미충족" && "bg-red-50/50")}>
                    <td className="px-3 py-2.5 font-medium text-gray-800">{row.condition}</td>
                    <td className="px-3 py-2.5 text-gray-500">{row.first}</td>
                    <td className="px-3 py-2.5 text-gray-700">{row.second}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-full", STATUS_COLORS[row.status] ?? "bg-gray-100 text-gray-600")}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-orange-600">{row.blocker}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 7. 핵심 병목 ───────────────────────────────── */}
        <div className="glass rounded-2xl p-6">
          <SectionTitle n={7} title="남은 핵심 병목 (2차에서 새로 드러난 한 가지)" />
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-red-800 mb-2">병목: {d.bottleneck.title}</p>
                <div className="bg-white/60 rounded-lg p-3 mb-3">
                  <p className="text-sm text-gray-700">{d.bottleneck.detail}</p>
                </div>
                <div className="bg-red-100 rounded-lg p-3">
                  <p className="text-xs text-red-700">{d.bottleneck.warning}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 8. ROI 기반 개선 권고안 ────────────────────── */}
        <div className="glass rounded-2xl p-6">
          <SectionTitle n={8} title="레버리지 포인트(ROI) 기반 개선 권고안" />
          <div className="rounded-xl bg-white/40 border border-white/60 p-4 mb-5">
            <p className="font-semibold text-gray-800 mb-1 text-sm">"어디에 개입하면 가장 크게 좋아지는가?"</p>
            <p className="text-xs text-gray-500">
              관리 관점에서 가장 중요한 것은 "지금 할 수 있는 것의 목록"이 아니라,{" "}
              <strong>"개입 대비 효과가 가장 큰 지점(High-Leverage Point)"</strong>이다.
            </p>
          </div>

          <div className="space-y-5">
            {d.recommendations.map((r, i) => (
              <div key={i} className={clsx("rounded-xl p-5", PRIORITY_STYLES[r.priority].border)}>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={clsx("text-xs font-bold px-2.5 py-1 rounded-full border", PRIORITY_STYLES[r.priority].tag)}>
                    {r.leverageLabel}
                  </span>
                  <h3 className="font-bold text-gray-900">{r.title}</h3>
                  <span className="ml-auto text-xs text-gray-500 font-medium">{r.roi}</span>
                </div>

                {/* 왜 */}
                <div className="bg-white/60 rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">왜 이게 우선순위인가</p>
                  <p className="text-sm text-gray-700 mb-2">{r.why}</p>
                  {r.situationItems.length > 0 && (
                    <ul className="space-y-0.5">
                      {r.situationItems.map((s, j) => (
                        <li key={j} className="text-xs text-gray-600 flex items-start gap-1.5">
                          <span className="text-gray-400 mt-0.5 shrink-0">·</span>{s}
                        </li>
                      ))}
                    </ul>
                  )}
                  {r.keyMessage && (
                    <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                      <p className="text-xs font-medium text-amber-700">💡 {r.keyMessage}</p>
                    </div>
                  )}
                </div>

                {/* Before / After */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div className="bg-white/50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-500 mb-2">✗ Before (현재 관찰된 상태)</p>
                    {r.before.map((b, j) => (
                      <p key={j} className="text-xs text-gray-600 mb-1">• {b}</p>
                    ))}
                  </div>
                  <div className="bg-emerald-50/60 rounded-lg p-3 border border-emerald-200">
                    <p className="text-xs font-semibold text-emerald-600 mb-2">✓ After (권장 표준)</p>
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">{r.afterTemplate}</pre>
                    {r.afterRules.map((rule, j) => (
                      <p key={j} className="text-xs text-emerald-700 mt-1">• {rule}</p>
                    ))}
                  </div>
                </div>

                {/* 기대 효과 */}
                <div className="rounded-lg p-3" style={{ background: EFFECT_BG[i] }}>
                  <p className="text-xs font-semibold text-white/70 mb-1.5">기대 효과 (즉시 체감)</p>
                  {r.effects.map((e, j) => (
                    <p key={j} className="text-xs text-white mb-0.5">• {e}</p>
                  ))}
                  {r.badge && (
                    <div className="mt-2 bg-white/10 rounded px-2 py-1">
                      <p className="text-xs text-white/90">{r.badge}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 9. AI 컨설턴트 총평 ────────────────────────── */}
        <div className="glass rounded-2xl p-6">
          <SectionTitle n={9} title="AI 컨설턴트 총평" />

          {/* 프로필 */}
          <div className="flex items-start gap-4 p-4 bg-white/40 rounded-xl border border-white/60 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent)" }}>
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-bold text-gray-900">Gridge AI Consulting Team</p>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">만족도 전문가</span>
              </div>
              <p className="text-xs text-gray-500">AI Engineering Specialist · Developer Productivity Expert</p>
              <p className="text-xs text-gray-600 mt-1">전문 분야: AI Agent 활용 패턴 분석, 프롬프트/컨텍스트 엔지니어링 설계, 개발자 생산성 진단 및 최적화 컨설팅</p>
            </div>
          </div>

          <div className="rounded-xl p-4 mb-6 text-white" style={{ background: "var(--accent)" }}>
            <p className="font-bold mb-1">AI Agent 활용 역량 객관 평가</p>
            <p className="text-xs opacity-80">본 평가는 개인의 주관적 인상이나 결과물 만족도가 아닌, 입력-출력-검증-도구-결과의 5가지 축을 기준으로 수행되었습니다.</p>
          </div>

          {/* 5대 축 점수 테이블 */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">5대 축 점수 비교 요약</p>
          <div className="overflow-x-auto rounded-xl overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--accent)" }} className="text-white">
                  {["평가 축", "1차", "2차", "변화", "핵심 해석"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-semibold text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.consultantSummary.fiveAxes.map((row, i) => (
                  <tr key={i} className={clsx("border-b border-white/30 hover:bg-white/20 transition-colors", i % 2 === 0 ? "bg-white/30" : "bg-white/10")}>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{row.axis}</td>
                    <td className="px-4 py-2.5 text-gray-500">{row.first}</td>
                    <td className="px-4 py-2.5">
                      <span className="font-bold px-2 py-0.5 rounded text-white text-xs" style={{ background: "var(--accent)" }}>{row.second}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">{row.delta}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-600">{row.insight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 중요한 점 */}
          <div className="rounded-xl border-l-4 border-indigo-400 bg-indigo-50/50 p-4 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-indigo-600" />
              <p className="text-xs font-bold text-indigo-700">중요한 점</p>
            </div>
            <p className="text-sm text-gray-700">{d.consultantSummary.keyInsight}</p>
          </div>

          {/* 축별 변화 해석 */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">축별 변화 해석 (성장 관점)</p>
          <div className="space-y-4 mb-6">
            {d.consultantSummary.axisDetails.map((ax, i) => (
              <div key={i} className="rounded-xl border border-white/60 bg-white/30 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className={clsx("w-7 h-7 rounded-lg flex items-center justify-center", i === 0 ? "bg-blue-500" : "bg-purple-500")}>
                    <Shield className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{ax.axis}</p>
                    <p className="text-xs text-gray-400">{ax.sub}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-gray-50/80 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-400 mb-2">1차 상태</p>
                    {ax.first.map((t, j) => <p key={j} className="text-xs text-gray-600 mb-0.5">· {t}</p>)}
                  </div>
                  <div className="bg-indigo-50/80 rounded-lg p-3 border border-indigo-100">
                    <p className="text-xs font-semibold text-indigo-600 mb-2">2차 변화</p>
                    {ax.second.map((t, j) => (
                      <div key={j} className="flex items-start gap-1 mb-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-gray-700">{t}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-emerald-50/80 rounded-lg p-3 border border-emerald-100">
                    <p className="text-xs font-semibold text-emerald-700 mb-1.5">성장 의미</p>
                    <p className="text-xs text-gray-600 mb-2">{ax.growth}</p>
                    <div className="bg-amber-50 rounded px-2 py-1 border border-amber-100">
                      <p className="text-xs text-amber-700">⚠ {ax.weakness}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 성숙도 레벨 변화 타임라인 */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">성숙도 레벨 변화 요약 (AI Collaboration Maturity)</p>
          <div className="relative pl-8 space-y-3">
            {d.consultantSummary.timeline.map((t, i) => (
              <div key={i} className="relative">
                {i < d.consultantSummary.timeline.length - 1 && (
                  <div className="absolute left-[-1.35rem] top-8 bottom-[-0.75rem] w-0.5 bg-gray-200" />
                )}
                <div className={clsx(
                  "absolute left-[-1.75rem] top-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center",
                  i === 0 ? "bg-gray-400" : i === 1 ? "bg-indigo-600" : "bg-purple-500"
                )} />
                <div className={clsx(
                  "rounded-xl border p-4",
                  i === 0 ? "bg-white/30 border-white/50" : i === 1 ? "border-indigo-200 bg-indigo-50/60" : "border-purple-200 bg-purple-50/60"
                )}>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-500">{t.step}{t.date ? ` · ${t.date}` : ""}</span>
                    <span className={clsx(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      i === 0 ? "bg-gray-200 text-gray-600" : i === 1 ? "bg-indigo-100 text-indigo-700" : "bg-purple-100 text-purple-700"
                    )}>
                      {t.levelBadge}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 푸터 */}
        <div className="text-center text-xs text-gray-400 pb-4">
          Generated by Gridge AI Maturity Engine · {d.period.second} 기준 · Confidential
        </div>
      </div>
    </main>
  );
}
