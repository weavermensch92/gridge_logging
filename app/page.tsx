"use client";

import { useRouter } from "next/navigation";
import { Shield, Code2, Activity } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center relative"
      style={{ background: "var(--bg-base)" }}
    >
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--accent)" }}
        />
        <div
          className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full opacity-10 blur-3xl"
          style={{ background: "#6B74F0" }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-10 px-4">
        {/* 헤더 */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-7 h-7" style={{ color: "var(--accent)" }} />
            <span className="text-xl font-bold tracking-tight text-gray-800">Gridge</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            AI Usage Monitoring
          </h1>
          <p className="text-gray-500 text-base max-w-sm">
            조직의 AI 활용 로그를 추적하고 개발자 성장을 코칭합니다
          </p>
        </div>

        {/* 선택 카드 */}
        <div className="flex flex-col sm:flex-row gap-5 w-full max-w-lg">
          {/* 어드민 */}
          <button
            onClick={() => router.push("/admin")}
            className="glass flex-1 rounded-2xl p-7 flex flex-col items-start gap-4 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform text-left"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(23,34,232,0.1)" }}
            >
              <Shield className="w-6 h-6" style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
                Admin
              </p>
              <h2 className="text-xl font-bold text-gray-900">팀 대시보드</h2>
              <p className="text-sm text-gray-500 mt-1">
                팀 전체 AI 로그 열람 및 비용 분석
              </p>
            </div>
            <div
              className="text-xs font-medium px-3 py-1 rounded-full"
              style={{ background: "rgba(23,34,232,0.08)", color: "var(--accent)" }}
            >
              김태영 (Admin) →
            </div>
          </button>

          {/* 개발자 */}
          <button
            onClick={() => router.push("/developer")}
            className="glass flex-1 rounded-2xl p-7 flex flex-col items-start gap-4 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform text-left"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(16,185,129,0.1)" }}
            >
              <Code2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
                Developer
              </p>
              <h2 className="text-xl font-bold text-gray-900">내 로그 + 코칭</h2>
              <p className="text-sm text-gray-500 mt-1">
                내 AI 사용 내역과 성장 리포트 확인
              </p>
            </div>
            <div className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-50 text-emerald-600">
              강지수 (개발팀) →
            </div>
          </button>
        </div>

        {/* 푸터 */}
        <p className="text-xs text-gray-400">
          Softsquared Inc. · Gridge Logging Demo v0.1
        </p>
      </div>
    </main>
  );
}
