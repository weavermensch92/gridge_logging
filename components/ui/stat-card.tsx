"use client";

import { ChevronRight } from "lucide-react";
import clsx from "clsx";

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  alert?: boolean;
  onClick?: () => void;
};

export function StatCard({ icon, label, value, sub, alert, onClick }: StatCardProps) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper onClick={onClick}
      className={clsx("glass rounded-2xl p-5 text-left transition-shadow", onClick && "hover:shadow-lg group")}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
        </div>
        {onClick && <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />}
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      {sub && <p className={clsx("text-xs mt-0.5", alert ? "text-red-500 font-medium" : "text-gray-400")}>{sub}</p>}
    </Wrapper>
  );
}
