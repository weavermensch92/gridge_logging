"use client";

import clsx from "clsx";
import type { Team } from "@/types";

type TeamFilterProps = {
  teams: Team[];
  value: string;
  onChange: (team: string) => void;
};

export function TeamFilter({ teams, value, onChange }: TeamFilterProps) {
  return (
    <div className="glass rounded-2xl p-3 flex items-center gap-2 flex-wrap">
      <span className="text-xs font-medium text-gray-500 w-8">팀</span>
      {["전체", ...teams.map(t => t.name)].map(t => (
        <button key={t} onClick={() => onChange(t)}
          className={clsx("text-xs px-3 py-1.5 rounded-full font-medium transition-colors",
            value === t ? "text-white" : "bg-white/60 text-gray-500 hover:bg-white/80")}
          style={value === t ? { background: "var(--accent)" } : {}}>
          {t}
        </button>
      ))}
    </div>
  );
}
