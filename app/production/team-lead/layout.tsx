"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Activity, LayoutDashboard, Users, FileText,
  BarChart3, Shield, LogOut,
} from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { key: "dashboard", label: "내 팀 현황", icon: <LayoutDashboard className="w-4 h-4" />, href: "/production/team-lead/dashboard" },
  { key: "members",   label: "팀원 관리",  icon: <Users className="w-4 h-4" />,           href: "/production/team-lead/members" },
  { key: "logs",      label: "팀 로그",    icon: <FileText className="w-4 h-4" />,        href: "/production/team-lead/logs" },
  { key: "maturity",  label: "팀 성숙도",  icon: <BarChart3 className="w-4 h-4" />,       href: "/production/team-lead/maturity" },
  { key: "security",  label: "위험 로그",  icon: <Shield className="w-4 h-4" />,          href: "/production/team-lead/security" },
];

export default function TeamLeadLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-base)" }}>
      <aside className="w-56 flex-shrink-0 glass border-r border-white/50 flex flex-col">
        <div className="p-5 border-b border-white/50">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" style={{ color: "var(--accent)" }} />
            <span className="font-bold text-gray-800 text-sm">Gridge</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">팀장 · 개발팀</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <button key={item.key}
              onClick={() => router.push(item.href)}
              className={clsx(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === item.href ? "text-white" : "text-gray-500 hover:bg-white/40 hover:text-gray-700"
              )}
              style={pathname === item.href ? { background: "var(--accent)" } : {}}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/50">
          <button onClick={() => router.push("/production/login")}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/40 hover:text-gray-600 transition-colors">
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
