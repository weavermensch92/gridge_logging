"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  Activity, LayoutDashboard, Users as UsersIcon, Settings,
  BarChart3, Share2, Shield, FileText, ChevronDown, ChevronRight,
  LayoutGrid, LogOut,
} from "lucide-react";
import clsx from "clsx";
import { teamsApi } from "@/lib/api";
import type { Team } from "@/types";

type NavItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: { key: string; label: string; href: string }[];
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsOpen, setTeamsOpen] = useState(true);

  const fetchTeams = useCallback(async () => {
    const res = await teamsApi.list();
    if (res.data) setTeams(res.data.teams);
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const navItems: NavItem[] = [
    { key: "dashboard", label: "대시보드", icon: <LayoutDashboard className="w-4 h-4" />, href: "/production/admin/dashboard" },
    {
      key: "teams", label: "팀 관리", icon: <LayoutGrid className="w-4 h-4" />,
      children: teams.map(t => ({ key: t.id, label: t.name, href: `/production/admin/${t.id}` })),
    },
    { key: "logs", label: "AI 로그", icon: <FileText className="w-4 h-4" />, href: "/production/admin/logs" },
    { key: "ai-maturity", label: "AI 성숙도", icon: <BarChart3 className="w-4 h-4" />, href: "/production/admin/ai-maturity" },
    { key: "files", label: "공유 파일", icon: <Share2 className="w-4 h-4" />, href: "/production/admin/files" },
    { key: "security", label: "보안 설정", icon: <Shield className="w-4 h-4" />, href: "/production/admin/security" },
    { key: "users", label: "유저 관리", icon: <UsersIcon className="w-4 h-4" />, href: "/production/admin/users" },
    { key: "settings", label: "설정", icon: <Settings className="w-4 h-4" />, href: "/production/admin/settings" },
  ];

  const isActive = (href?: string) => href && pathname === href;
  const isChildActive = (item: NavItem) =>
    item.children?.some(c => pathname === c.href) ||
    (item.key === "teams" && pathname.startsWith("/production/admin/team"));

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-base)" }}>
      {/* 사이드바 */}
      <aside className="w-60 flex-shrink-0 glass border-r border-white/50 flex flex-col">
        {/* 로고 */}
        <div className="p-5 border-b border-white/50">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" style={{ color: "var(--accent)" }} />
            <span className="font-bold text-gray-800 text-sm">Gridge Admin</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Softsquared Inc.</p>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <div key={item.key}>
              {item.children ? (
                <>
                  <button
                    onClick={() => setTeamsOpen(v => !v)}
                    className={clsx(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isChildActive(item) ? "bg-white/60 text-gray-900" : "text-gray-500 hover:bg-white/40 hover:text-gray-700"
                    )}
                  >
                    {item.icon}
                    <span className="flex-1 text-left">{item.label}</span>
                    {teamsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {teamsOpen && (
                    <div className="ml-6 mt-0.5 space-y-0.5">
                      {item.children.map(child => (
                        <button key={child.key}
                          onClick={() => router.push(child.href)}
                          className={clsx(
                            "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                            pathname === child.href
                              ? "text-white"
                              : "text-gray-400 hover:bg-white/40 hover:text-gray-600"
                          )}
                          style={pathname === child.href ? { background: "var(--accent)" } : {}}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                          {child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => item.href && router.push(item.href)}
                  className={clsx(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "text-white"
                      : "text-gray-500 hover:bg-white/40 hover:text-gray-700"
                  )}
                  style={isActive(item.href) ? { background: "var(--accent)" } : {}}
                >
                  {item.icon}
                  {item.label}
                </button>
              )}
            </div>
          ))}
        </nav>

        {/* 하단 */}
        <div className="p-3 border-t border-white/50">
          <button onClick={() => router.push("/production/login")}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/40 hover:text-gray-600 transition-colors">
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
