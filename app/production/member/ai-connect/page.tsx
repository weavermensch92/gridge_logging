"use client";

import { useState } from "react";
import {
  Plug, CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronRight,
  Download, Terminal, Globe, ExternalLink, Loader2, RefreshCw,
} from "lucide-react";
import clsx from "clsx";
import type { AiToolConnection, AiToolType } from "@/types";

const AI_TOOL_LABEL: Record<AiToolType, string> = {
  chatgpt: "ChatGPT", claude_web: "Claude 웹", gemini_web: "Gemini 웹",
  claude_code: "Claude Code", cursor: "Cursor",
};

const STATUS_STYLE: Record<string, { icon: React.ReactNode; label: string; bg: string; text: string }> = {
  connected:        { icon: <CheckCircle2 className="w-4 h-4" />, label: "연동 완료", bg: "bg-emerald-100", text: "text-emerald-600" },
  connecting:       { icon: <Loader2 className="w-4 h-4 animate-spin" />, label: "연동 확인 중", bg: "bg-amber-100", text: "text-amber-600" },
  approved:         { icon: <AlertCircle className="w-4 h-4" />, label: "연동 필요", bg: "bg-blue-100", text: "text-blue-600" },
  pending_approval: { icon: <Clock className="w-4 h-4" />, label: "승인 대기", bg: "bg-gray-100", text: "text-gray-500" },
  rejected:         { icon: <AlertCircle className="w-4 h-4" />, label: "거절됨", bg: "bg-red-100", text: "text-red-500" },
};

const SETUP_GUIDES: Record<string, { title: string; icon: React.ReactNode; steps: string[] }> = {
  shared_account: {
    title: "공유 계정 안내",
    icon: <Globe className="w-5 h-5" />,
    steps: [
      "아래 공유 계정 정보로 ChatGPT에 로그인하세요.",
      "기존 개인 계정이 아닌 제공된 팀 스페이스 계정을 사용합니다.",
      "로그인 후 일반적으로 ChatGPT를 사용하면 됩니다.",
      "사용 내역은 자동으로 수집됩니다.",
    ],
  },
  chrome_extension: {
    title: "Chrome Extension 설치",
    icon: <Download className="w-5 h-5" />,
    steps: [
      "아래 버튼으로 Gridge Chrome Extension을 다운로드합니다.",
      "Chrome 브라우저에서 chrome://extensions 페이지를 엽니다.",
      "우측 상단의 '개발자 모드'를 활성화합니다.",
      "다운로드 받은 파일을 드래그 앤 드롭하여 설치합니다.",
      "Extension 팝업에서 서버 URL과 인증 토큰을 입력합니다.",
      "Claude.ai 또는 Gemini 웹에서 사용하면 자동으로 로그가 수집됩니다.",
    ],
  },
  local_proxy: {
    title: "로컬 프록시 설치",
    icon: <Terminal className="w-5 h-5" />,
    steps: [
      "터미널에서 다음 명령어를 실행합니다:\nnpx gridge-proxy --server <서버URL> --key <인증키>",
      "프록시가 localhost:8080에서 실행됩니다.",
      "Claude Code 환경변수 설정:\nexport ANTHROPIC_BASE_URL=http://localhost:8080/v1",
      "Cursor의 경우:\nSettings → Extensions → API Base URL → http://localhost:8080/v1",
      "설정 후 일반적으로 AI 도구를 사용하면 됩니다.",
      "백엔드에서 프록시 연결을 자동 감지하여 연동이 완료됩니다.",
    ],
  },
};

/** Mock 연동 데이터 */
const MOCK_CONNECTIONS: AiToolConnection[] = [
  { tool: "claude_code", status: "connected", method: "local_proxy", connected_at: "2026-04-01", guide_completed: true },
  { tool: "claude_web", status: "approved", method: "chrome_extension", approved_at: "2026-04-09", guide_completed: false },
  { tool: "chatgpt", status: "pending_approval", method: "shared_account", requested_at: "2026-04-10" },
];

export default function AiConnectPage() {
  const [connections, setConnections] = useState<AiToolConnection[]>(MOCK_CONNECTIONS);
  const [expandedTool, setExpandedTool] = useState<AiToolType | null>(null);
  const [checkingConnection, setCheckingConnection] = useState<AiToolType | null>(null);

  const startGuide = (tool: AiToolType) => {
    setConnections(prev => prev.map(c =>
      c.tool === tool ? { ...c, guide_completed: true, status: "connecting" as const } : c
    ));
  };

  const checkConnection = (tool: AiToolType) => {
    setCheckingConnection(tool);
    // Mock: 2초 후 연동 확인
    setTimeout(() => {
      setConnections(prev => prev.map(c =>
        c.tool === tool ? { ...c, status: "connected" as const, connected_at: new Date().toISOString() } : c
      ));
      setCheckingConnection(null);
    }, 2000);
  };

  const connectedCount = connections.filter(c => c.status === "connected").length;
  const actionNeeded = connections.filter(c => c.status === "approved" || c.status === "connecting");

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI 연동</h1>
        <p className="text-sm text-gray-500">허가된 AI 도구를 연동하고 상태를 확인합니다</p>
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-600">{connectedCount}</p>
          <p className="text-xs text-gray-500">연동 완료</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-amber-600">{actionNeeded.length}</p>
          <p className="text-xs text-gray-500">연동 필요</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-gray-900">{connections.length}</p>
          <p className="text-xs text-gray-500">전체 AI 도구</p>
        </div>
      </div>

      {/* 연동 카드 목록 */}
      <div className="space-y-4">
        {connections.map(conn => {
          const st = STATUS_STYLE[conn.status];
          const guide = SETUP_GUIDES[conn.method];
          const isExpanded = expandedTool === conn.tool;
          const isChecking = checkingConnection === conn.tool;
          const needsAction = conn.status === "approved" || conn.status === "connecting";

          return (
            <div key={conn.tool} className="glass rounded-2xl overflow-hidden">
              {/* 헤더 */}
              <div className={clsx("p-5 flex items-center gap-4", needsAction && "border-l-4")}
                style={needsAction ? { borderLeftColor: "var(--accent)" } : {}}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: conn.status === "connected" ? "#10b981" : "var(--accent)" }}>
                  {AI_TOOL_LABEL[conn.tool]?.[0]}
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-gray-900">{AI_TOOL_LABEL[conn.tool]}</p>
                  <p className="text-xs text-gray-400">
                    {conn.method === "shared_account" ? "공유 계정" :
                     conn.method === "chrome_extension" ? "Chrome Extension" : "로컬 프록시"}
                    {conn.connected_at && ` · ${new Date(conn.connected_at).toLocaleDateString("ko-KR")} 연동`}
                  </p>
                </div>
                <div className={clsx("flex items-center gap-1.5 text-sm font-medium", st.text)}>
                  {st.icon}<span>{st.label}</span>
                </div>

                {/* 액션 버튼 */}
                {conn.status === "approved" && !conn.guide_completed && (
                  <button onClick={() => { startGuide(conn.tool); setExpandedTool(conn.tool); }}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "var(--accent)" }}>
                    연동 시작
                  </button>
                )}
                {(conn.status === "connecting" || (conn.status === "approved" && conn.guide_completed)) && (
                  <button onClick={() => checkConnection(conn.tool)} disabled={isChecking}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: "var(--accent)" }}>
                    {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {isChecking ? "확인 중..." : "연동 확인"}
                  </button>
                )}
                {conn.status === "connected" && (
                  <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-600 font-semibold">사용 가능</span>
                )}

                {/* 가이드 토글 */}
                {conn.status !== "pending_approval" && conn.status !== "rejected" && (
                  <button onClick={() => setExpandedTool(isExpanded ? null : conn.tool)}
                    className="p-2 rounded-lg hover:bg-white/60 text-gray-400">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* 연동 가이드 (확장) */}
              {isExpanded && guide && (
                <div className="px-5 pb-5 border-t border-white/50">
                  <div className="mt-4 rounded-xl bg-white/50 border border-white/80 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span style={{ color: "var(--accent)" }}>{guide.icon}</span>
                      <h3 className="text-sm font-bold text-gray-800">{guide.title}</h3>
                    </div>
                    <ol className="space-y-3">
                      {guide.steps.map((step, i) => (
                        <li key={i} className="flex gap-3">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                            style={{ background: "var(--accent)" }}>{i + 1}</div>
                          <div className="text-sm text-gray-600 whitespace-pre-wrap">
                            {step.includes("\n") ? (
                              <>
                                {step.split("\n")[0]}
                                <pre className="mt-1 p-2 rounded-lg bg-gray-900 text-gray-300 text-xs font-mono overflow-x-auto">
                                  {step.split("\n").slice(1).join("\n")}
                                </pre>
                              </>
                            ) : step}
                          </div>
                        </li>
                      ))}
                    </ol>

                    {conn.method === "shared_account" && (
                      <div className="mt-4 rounded-lg bg-blue-50 border border-blue-100 p-3">
                        <p className="text-xs font-semibold text-blue-700 mb-1">공유 계정 정보</p>
                        <p className="text-sm text-gray-600">계정: <span className="font-mono">team-dev@softsquared.com</span></p>
                        <p className="text-sm text-gray-600">비밀번호: 관리자에게 문의하세요</p>
                      </div>
                    )}

                    {conn.method === "chrome_extension" && (
                      <button className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                        style={{ background: "var(--accent)" }}>
                        <Download className="w-4 h-4" /> Extension 다운로드
                      </button>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-400">
                        설치 완료 후 <b>&ldquo;연동 확인&rdquo;</b> 버튼을 누르면 서버에서 연결을 자동 감지합니다.
                        연동이 확인되면 AI 사용이 활성화됩니다.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
