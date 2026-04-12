"use client";

import clsx from "clsx";
import type { RiskSeverity } from "@/types";

const STYLES: Record<RiskSeverity, { bg: string; text: string; dot: string }> = {
  critical: { bg: "bg-red-100", text: "text-red-600", dot: "bg-red-500" },
  warning: { bg: "bg-amber-100", text: "text-amber-600", dot: "bg-amber-400" },
  info: { bg: "bg-blue-100", text: "text-blue-600", dot: "bg-blue-400" },
};

export function SeverityBadge({ severity, showDot }: { severity: RiskSeverity; showDot?: boolean }) {
  const s = STYLES[severity];
  return (
    <div className="flex items-center gap-1.5">
      {showDot && <div className={clsx("w-2 h-2 rounded-full", s.dot)} />}
      <span className={clsx("text-[10px] font-semibold px-2 py-0.5 rounded-full", s.bg, s.text)}>
        {severity}
      </span>
    </div>
  );
}
