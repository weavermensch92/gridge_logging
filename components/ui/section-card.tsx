"use client";

import { ChevronRight } from "lucide-react";

type SectionCardProps = {
  title: string;
  icon: React.ReactNode;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
};

export function SectionCard({ title, icon, action, children }: SectionCardProps) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span style={{ color: "var(--accent)" }}>{icon}</span>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{title}</h2>
        </div>
        {action && (
          <button onClick={action.onClick}
            className="flex items-center gap-1 text-xs font-medium hover:underline"
            style={{ color: "var(--accent)" }}>
            {action.label} <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
