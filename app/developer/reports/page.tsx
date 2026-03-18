"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ChevronRight, TrendingUp, Zap, DollarSign,
  AlertTriangle, CheckCircle2, BarChart3, Clock, FileText,
  Lock,
} from "lucide-react";
import { PAST_REPORTS, ReportSummary } from "@/lib/mockData";
import clsx from "clsx";

const LEVEL_BORDER: Record<string, string> = {
  "Lv.1~2": "border-l-gray-400",
  "Lv.2~3": "border-l-amber-400",
  "Lv.3":   "border-l-blue-500",
  "Lv.4":   "border-l-purple-500",
};

// 별점(점수 바) 렌더
function ScoreBar({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={clsx(
            "w-3 h-3 rounded-sm",
            i < score ? "opacity-100" : "opacity-20"
          )}
          style={{ background: i < score ? "var(--accent)" : "#9ca3af" }}
        />
      ))}
    </div>
  );
}

function ReportCard({ report, isLatest }: { report: ReportSummary; isLatest: boolean }) {
  const [expanded, setExpanded] = useState(isLatest);
  const router = useRouter();

  return (
    <div
      className={clsx(
        "glass rounded-2xl overflow-hidden border-l-4 transition-all",
        LEVEL_BORDER[report.level] ?? "border-l-gray-300"
      )}
    >
      {/* 카드 헤더 — 항상 표시 */}
      <div
        className="px-6 py-5 flex items-center gap-4 cursor-pointer hover:bg-white/20 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        {/* 차수 배지 */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: isLatest ? "var(--accent)" : "#6b7280" }}
        >
          {report.seq}차
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-800">{report.date} 평가</span>
            <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full", report.levelColor)}>
              {report.level} {report.levelLabel}
            </span>
            {isLatest && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                최신
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{report.period} · {report.project}</p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400">AI 작업</p>
            <p className="text-sm font-semibold text-gray-700">{report.aiTaskCount}회</p>
          </div>
          <ChevronRight
            className={clsx(
              "w-4 h-4 text-gray-400 transition-transform",
              expanded && "rotate-90"
            )}
          />
        </div>
      </div>

      {/* 카드 본문 — 펼침 시 */}
      {expanded && (
        <div className="px-6 pb-6 border-t border-white/40 pt-5 space-y-5">

          {/* 핵심 인사이트 */}
          <div className="bg-white/40 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">핵심 인사이트</p>
            <p className="text-sm text-gray-700 leading-relaxed">{report.keyInsight}</p>
          </div>

          {/* 지표 요약 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/30 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="text-xs">AI 작업</span>
              </div>
              <p className="text-lg font-bold text-gray-800">{report.aiTaskCount}회</p>
            </div>
            <div className="bg-white/30 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                <Zap className="w-3.5 h-3.5" />
                <span className="text-xs">총 토큰</span>
              </div>
              <p className="text-lg font-bold text-gray-800">{report.totalTokens.toLocaleString()}</p>
            </div>
            <div className="bg-white/30 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                <DollarSign className="w-3.5 h-3.5" />
                <span className="text-xs">비용</span>
              </div>
              <p className="text-lg font-bold text-gray-800">${report.totalCostUsd.toFixed(5)}</p>
            </div>
            <div className="bg-white/30 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="text-xs">레벨</span>
              </div>
              <p className="text-sm font-bold text-gray-800">{report.level}</p>
            </div>
          </div>

          {/* 역량 레이더 (텍스트 표시) */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-3">역량 점수 (5점 만점)</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {report.radarScores.map(({ axis, score }) => (
                <div key={axis} className="flex items-center justify-between bg-white/30 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-600">{axis}</span>
                  <ScoreBar score={score} />
                </div>
              ))}
            </div>
          </div>

          {/* 성장 / 병목 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2 bg-emerald-50/60 border border-emerald-100 rounded-xl p-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-0.5">최대 성장</p>
                <p className="text-sm font-medium text-gray-800">{report.topGain}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 bg-amber-50/60 border border-amber-100 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-0.5">주요 병목</p>
                <p className="text-sm font-medium text-gray-800">{report.bottleneck}</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex justify-end">
            {report.hasDetail ? (
              <button
                onClick={() => router.push("/developer/report")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity"
                style={{ background: "var(--accent)" }}
              >
                <FileText className="w-4 h-4" />
                상세 리포트 보기
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-400 text-sm bg-white/30 border border-white/50 cursor-not-allowed">
                <Lock className="w-4 h-4" />
                상세 리포트 준비 중
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const router = useRouter();
  const sorted = [...PAST_REPORTS].sort((a, b) => b.seq - a.seq); // 최신순
  const latest = sorted[0];

  // 레벨 변화 시각화용
  const levelFlow = PAST_REPORTS.map(r => ({ seq: r.seq, level: r.level, label: r.levelLabel }));

  return (
    <main
      className="min-h-screen p-6"
      style={{ background: "var(--bg-base)" }}
    >
      {/* 배경 장식 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div
          className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
          style={{ background: "#6366f1" }}
        />
        <div
          className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-8 blur-3xl"
          style={{ background: "var(--accent)" }}
        />
      </div>

      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/developer")}
            className="p-2 rounded-xl glass hover:scale-105 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI 성숙도 평가 히스토리</h1>
            <p className="text-sm text-gray-500">강지수 · 개발팀 · 총 {PAST_REPORTS.length}회 평가</p>
          </div>
        </div>

        {/* 레벨 성장 타임라인 요약 */}
        <div className="glass rounded-2xl px-6 py-5 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-4">레벨 성장 흐름</p>
          <div className="flex items-center gap-2 flex-wrap">
            {levelFlow.map((r, i) => (
              <div key={r.seq} className="flex items-center gap-2">
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">{r.seq}차</div>
                  <div
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{
                      background: r.seq === latest.seq
                        ? "var(--accent)"
                        : r.seq === levelFlow.length - 1
                        ? "#f59e0b"
                        : "#6b7280"
                    }}
                  >
                    {r.level}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{r.label}</div>
                </div>
                {i < levelFlow.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-300 mt-1" />
                )}
              </div>
            ))}
            <div className="flex items-center gap-2 opacity-40">
              <ChevronRight className="w-4 h-4 text-gray-300 mt-1" />
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">목표</div>
                <div className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-dashed border-purple-400 text-purple-400">
                  Lv.4
                </div>
                <div className="text-xs text-gray-400 mt-1">Enable</div>
              </div>
            </div>
          </div>
        </div>

        {/* 평가 카드 목록 (최신순) */}
        <div className="space-y-4">
          {sorted.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              isLatest={report.id === latest.id}
            />
          ))}
        </div>

        {/* 다음 평가 예정 */}
        <div className="mt-4 glass rounded-2xl px-6 py-5 border-l-4 border-l-dashed border-gray-300 opacity-60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-sm flex-shrink-0">
              {PAST_REPORTS.length + 1}차
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">다음 평가 예정</p>
              <p className="text-xs text-gray-400">2026.01.20 예정 · ThinkTrace Project #28</p>
            </div>
            <div className="ml-auto">
              <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
                <Clock className="w-3.5 h-3.5" />
                준비 중
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
