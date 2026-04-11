"use client";

import { useRouter } from "next/navigation";
import { Plug, PlusCircle, FileText, BarChart3, ChevronRight, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import clsx from "clsx";
import type { AiToolConnection } from "@/types";

const AI_TOOL_LABEL: Record<string, string> = {
  chatgpt: "ChatGPT", claude_web: "Claude 웹", gemini_web: "Gemini 웹",
  claude_code: "Claude Code", cursor: "Cursor",
};

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  connected:        { icon: <CheckCircle2 className="w-4 h-4" />, label: "연동 완료",  color: "text-emerald-600" },
  connecting:       { icon: <Clock className="w-4 h-4" />,        label: "연동 중",    color: "text-amber-600" },
  approved:         { icon: <AlertCircle className="w-4 h-4" />,  label: "연동 필요",  color: "text-blue-600" },
  pending_approval: { icon: <Clock className="w-4 h-4" />,        label: "승인 대기",  color: "text-gray-500" },
  rejected:         { icon: <AlertCircle className="w-4 h-4" />,  label: "거절됨",    color: "text-red-500" },
};

/** Mock: 현재 멤버의 AI 연동 현황 */
const MOCK_CONNECTIONS: AiToolConnection[] = [
  { tool: "claude_code", status: "connected", method: "local_proxy", connected_at: "2026-04-01T00:00:00Z", guide_completed: true },
  { tool: "claude_web", status: "approved", method: "chrome_extension", approved_at: "2026-04-09T00:00:00Z", guide_completed: false },
  { tool: "chatgpt", status: "pending_approval", method: "shared_account", requested_at: "2026-04-10T00:00:00Z" },
];

export default function MemberDashboard() {
  const router = useRouter();
  const connections = MOCK_CONNECTIONS;
  const connectedCount = connections.filter(c => c.status === "connected").length;
  const pendingCount = connections.filter(c => c.status === "approved" || c.status === "connecting").length;

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">안녕하세요, 강지수님</h1>
        <p className="text-sm text-gray-500">개발팀 · AI 사용 현황</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button onClick={() => router.push("/production/member/ai-connect")}
          className="glass rounded-2xl p-5 text-left hover:shadow-lg group">
          <div className="flex items-center justify-between mb-2">
            <Plug className="w-4 h-4 text-gray-400" />
            <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-gray-500" />
          </div>
          <p className="text-2xl font-black text-gray-900">{connectedCount}<span className="text-sm font-normal text-gray-400 ml-1">개 연동</span></p>
          {pendingCount > 0 && <p className="text-xs text-amber-600 mt-0.5">{pendingCount}개 연동 필요</p>}
        </button>

        <button onClick={() => router.push("/production/member/request-ai")}
          className="glass rounded-2xl p-5 text-left hover:shadow-lg group">
          <div className="flex items-center justify-between mb-2">
            <PlusCircle className="w-4 h-4 text-gray-400" />
            <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-gray-500" />
          </div>
          <p className="text-sm font-bold text-gray-700">새 AI 도구 신청</p>
          <p className="text-xs text-gray-400 mt-0.5">사용할 AI 도구를 추가 신청</p>
        </button>

        <button onClick={() => router.push("/production/developer")}
          className="glass rounded-2xl p-5 text-left hover:shadow-lg group">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-gray-500" />
          </div>
          <p className="text-sm font-bold text-gray-700">내 AI 로그</p>
          <p className="text-xs text-gray-400 mt-0.5">사용 기록 확인</p>
        </button>
      </div>

      {/* AI 연동 현황 */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Plug className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">AI 연동 현황</h2>
          </div>
          <button onClick={() => router.push("/production/member/ai-connect")}
            className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: "var(--accent)" }}>
            관리 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-3">
          {connections.map(conn => {
            const cfg = STATUS_CONFIG[conn.status];
            return (
              <div key={conn.tool} className="flex items-center gap-4 p-3 rounded-xl bg-white/40">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                  style={{ background: "var(--accent)" }}>
                  {AI_TOOL_LABEL[conn.tool]?.[0] ?? "?"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{AI_TOOL_LABEL[conn.tool]}</p>
                  <p className="text-[10px] text-gray-400">
                    {conn.method === "shared_account" ? "공유 계정" : conn.method === "chrome_extension" ? "Chrome Extension" : "로컬 프록시"}
                  </p>
                </div>
                <div className={clsx("flex items-center gap-1.5 text-xs font-medium", cfg.color)}>
                  {cfg.icon}{cfg.label}
                </div>
                {conn.status === "approved" && (
                  <button onClick={() => router.push("/production/member/ai-connect")}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white" style={{ background: "var(--accent)" }}>
                    연동하기
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
