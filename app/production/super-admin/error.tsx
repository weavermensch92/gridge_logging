"use client";
import { AlertTriangle } from "lucide-react";
export default function SuperAdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
      <div className="glass rounded-2xl p-8 max-w-md text-center">
        <AlertTriangle className="w-10 h-10 mx-auto mb-4 text-red-400" />
        <h2 className="text-lg font-bold text-gray-900 mb-2">오류가 발생했습니다</h2>
        <p className="text-sm text-gray-500 mb-4">{error.message || "예기치 않은 오류입니다."}</p>
        <button onClick={reset} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: "var(--accent)" }}>다시 시도</button>
      </div>
    </div>
  );
}
