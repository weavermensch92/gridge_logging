"use client";

import { AlertTriangle } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="glass rounded-2xl p-8 max-w-md text-center">
        <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-red-400" />
        <h2 className="text-lg font-bold text-gray-900 mb-2">페이지 오류</h2>
        <p className="text-sm text-gray-500 mb-4">{error.message || "데이터를 불러오는 중 오류가 발생했습니다."}</p>
        <button onClick={reset}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90"
          style={{ background: "var(--accent)" }}>
          다시 시도
        </button>
      </div>
    </div>
  );
}
