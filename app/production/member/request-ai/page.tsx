"use client";

import { useState } from "react";
import { PlusCircle, Check, Clock, Send, Loader2 } from "lucide-react";
import clsx from "clsx";
import type { AiToolType } from "@/types";

const AI_SERVICES: { id: AiToolType; name: string; desc: string; method: string }[] = [
  { id: "chatgpt",     name: "ChatGPT",      desc: "OpenAI 웹 채팅 (공유 계정)",        method: "공유 계정 할당" },
  { id: "claude_web",  name: "Claude 웹",     desc: "Anthropic 웹 채팅",                method: "Chrome Extension" },
  { id: "gemini_web",  name: "Gemini 웹",     desc: "Google AI 웹 채팅",                method: "Chrome Extension" },
  { id: "claude_code", name: "Claude Code",   desc: "터미널 기반 AI 코딩 에이전트",      method: "로컬 프록시" },
  { id: "cursor",      name: "Cursor",        desc: "AI 코드 에디터",                   method: "로컬 프록시" },
];

/** Mock: 이미 신청/연동된 도구 */
const EXISTING: Set<AiToolType> = new Set(["claude_code", "claude_web", "chatgpt"]);

export default function RequestAiPage() {
  const [requested, setRequested] = useState<Set<AiToolType>>(new Set());
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selected = AI_SERVICES.filter(s => requested.has(s.id));

  const toggleTool = (id: AiToolType) => {
    if (EXISTING.has(id)) return;
    setRequested(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1000);
  };

  if (submitted) {
    return (
      <div className="p-6 max-w-4xl">
        <div className="glass rounded-2xl p-12 text-center">
          <Check className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--accent)" }} />
          <h2 className="text-xl font-bold text-gray-900 mb-2">AI 도구 신청 완료</h2>
          <p className="text-sm text-gray-500 mb-1">{selected.map(s => s.name).join(", ")} 신청이 접수되었습니다.</p>
          <p className="text-sm text-gray-400">관리자 승인 후 연동 안내가 표시됩니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI 도구 신청</h1>
        <p className="text-sm text-gray-500">사용하고 싶은 AI 도구를 선택하여 관리자에게 신청합니다</p>
      </div>

      {/* 도구 선택 */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">사용할 AI 도구 선택</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AI_SERVICES.map(svc => {
            const exists = EXISTING.has(svc.id);
            const checked = requested.has(svc.id);
            return (
              <button key={svc.id} onClick={() => toggleTool(svc.id)} disabled={exists}
                className={clsx(
                  "rounded-xl border p-4 flex items-start gap-3 text-left transition-colors",
                  exists ? "border-gray-200 bg-gray-50/40 opacity-60 cursor-not-allowed" :
                  checked ? "border-indigo-300 bg-indigo-50/40" : "border-white/80 hover:border-gray-300 hover:bg-white/40"
                )}>
                <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0",
                  checked ? "" : "opacity-70")}
                  style={{ background: checked ? "var(--accent)" : "#9ca3af" }}>
                  {svc.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-800">{svc.name}</p>
                    {exists && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-medium">이미 등록됨</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{svc.desc}</p>
                  <p className="text-[10px] text-gray-400 mt-1">연동 방식: {svc.method}</p>
                </div>
                {checked && !exists && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: "var(--accent)" }}>
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 사유 + 제출 */}
      {requested.size > 0 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">신청 정보</h2>
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">선택된 도구:</p>
            <div className="flex flex-wrap gap-2">
              {selected.map(s => (
                <span key={s.id} className="text-xs px-3 py-1 rounded-full font-medium text-white" style={{ background: "var(--accent)" }}>
                  {s.name}
                </span>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">사용 목적 (선택)</label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)}
              placeholder="예: 프로젝트 개발에 Claude Code 활용 필요"
              className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--accent)" }}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? "신청 중..." : "관리자에게 신청"}
          </button>
          <p className="text-[10px] text-gray-400 text-center mt-2">관리자가 승인하면 연동 안내가 표시됩니다</p>
        </div>
      )}
    </div>
  );
}
