import { Loader2 } from "lucide-react";

export default function ProductionLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <p className="text-sm text-gray-400">로딩 중...</p>
      </div>
    </div>
  );
}
