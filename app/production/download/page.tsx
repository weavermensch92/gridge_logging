"use client";

import { Download, Chrome, Terminal, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function DownloadPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gridge 도구 다운로드</h1>
          <p className="text-sm text-gray-500">AI 로그 수집을 위한 Extension과 Proxy를 설치하세요</p>
        </div>

        {/* Chrome Extension */}
        <div className="glass rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: "var(--accent)" }}>
              <Chrome className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Chrome Extension</h2>
              <p className="text-xs text-gray-500">Claude.ai · Gemini 웹 로그 수집</p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <Step n={1} text="GitHub에서 소스 다운로드:" />
            <CodeBlock text="git clone https://github.com/weavermensch92/gridge_logging.git" onCopy={() => copy("git clone https://github.com/weavermensch92/gridge_logging.git", "clone")} copied={copied === "clone"} />
            <Step n={2} text="Chrome에서 chrome://extensions 열기 → 개발자 모드 ON" />
            <Step n={3} text={`"압축해제된 확장 프로그램을 로드합니다" 클릭 → chrome-extension/ 폴더 선택`} />
            <Step n={4} text="Extension 아이콘 → 서버 URL, API Key, 유저 ID 입력 → 설정 저장" />
            <Step n={5} text="claude.ai 또는 gemini.google.com에서 대화 → 자동 수집 시작" />
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
            <p className="text-xs text-blue-700">
              <b>또는</b> GitHub에서 직접 <code className="bg-blue-100 px-1 rounded">chrome-extension/</code> 폴더만 다운로드:
              <br />
              Repository → Code → Download ZIP → 압축 해제 → <code className="bg-blue-100 px-1 rounded">chrome-extension/</code> 폴더 사용
            </p>
          </div>
        </div>

        {/* 로컬 프록시 */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: "var(--accent)" }}>
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">로컬 프록시 (향후 제공)</h2>
              <p className="text-xs text-gray-500">Claude Code · Cursor 로그 수집</p>
            </div>
          </div>

          <div className="space-y-3">
            <Step n={1} text="프록시 설치 (향후 npm 패키지로 제공 예정):" />
            <CodeBlock text="npx gridge-proxy --server https://gridge.company.com --key ext_xxxxx" onCopy={() => copy("npx gridge-proxy --server https://gridge.company.com --key ext_xxxxx", "proxy")} copied={copied === "proxy"} />
            <Step n={2} text="Claude Code 환경변수 설정:" />
            <CodeBlock text="export ANTHROPIC_BASE_URL=http://localhost:8080/v1" onCopy={() => copy("export ANTHROPIC_BASE_URL=http://localhost:8080/v1", "env")} copied={copied === "env"} />
            <Step n={3} text="Cursor: Settings → API Base URL → http://localhost:8080/v1" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
        style={{ background: "var(--accent)" }}>{n}</div>
      <p className="text-sm text-gray-700">{text}</p>
    </div>
  );
}

function CodeBlock({ text, onCopy, copied }: { text: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2 ml-7">
      <code className="text-xs text-gray-300 flex-1 font-mono overflow-x-auto">{text}</code>
      <button onClick={onCopy} className="text-gray-500 hover:text-gray-300 flex-shrink-0">
        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}
