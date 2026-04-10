"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Activity, BarChart3, Share2, Shield,
} from "lucide-react";
import clsx from "clsx";
import LogsTab from "./components/LogsTab";
import MaturityTab from "./components/MaturityTab";
import FilesTab from "./components/FilesTab";
import SecurityTab from "./components/SecurityTab";

type TabKey = "logs" | "maturity" | "files" | "security";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "logs",     label: "AI 로그",   icon: <Activity  className="w-4 h-4" /> },
  { key: "maturity", label: "AI 성숙도",  icon: <BarChart3 className="w-4 h-4" /> },
  { key: "files",    label: "공유 파일",  icon: <Share2    className="w-4 h-4" /> },
  { key: "security", label: "보안 설정",  icon: <Shield    className="w-4 h-4" /> },
];

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("logs");

  return (
    <main className="min-h-screen p-6" style={{ background: "var(--bg-base)" }}>
      {/* 배경 장식 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div
          className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
          style={{ background: "var(--accent)" }}
        />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="p-2 rounded-xl glass hover:scale-105 transition-transform"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">팀 AI 대시보드</h1>
              <p className="text-sm text-gray-500">Softsquared Inc. · Admin: 김태영</p>
            </div>
          </div>
        </div>

        {/* 탭 스위처 */}
        <div className="flex gap-1 glass rounded-xl p-1 mb-6 w-fit">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.key
                  ? "text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
              )}
              style={activeTab === tab.key ? { background: "var(--accent)" } : {}}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        {activeTab === "logs" && <LogsTab />}
        {activeTab === "maturity" && <MaturityTab />}
        {activeTab === "files" && <FilesTab />}
        {activeTab === "security" && <SecurityTab />}
      </div>
    </main>
  );
}
