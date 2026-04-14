"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Lock, Eye, EyeOff, Loader2, Check } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { authApi } from "@/lib/api";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const passwordValid = newPw.length >= 8;
  const passwordMatch = newPw === confirmPw && confirmPw.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!passwordValid) { setError("새 비밀번호는 최소 8자입니다."); return; }
    if (!passwordMatch) { setError("비밀번호가 일치하지 않습니다."); return; }
    if (currentPw === newPw) { setError("현재 비밀번호와 다른 비밀번호를 입력하세요."); return; }

    setSubmitting(true);
    const res = await authApi.changePassword(currentPw, newPw);

    if ("data" in res && res.data?.success) {
      await refreshUser();
      // 온보딩 다음 단계로 이동
      if (user?.role === "super_admin") router.push("/production/super-admin");
      else if (user?.role === "admin") router.push("/production/admin");
      else if (user?.role === "team_lead") router.push("/production/team-lead");
      else router.push("/production/member");
    } else {
      setError("error" in res ? res.error?.message ?? "비밀번호 변경에 실패했습니다." : "비밀번호 변경에 실패했습니다.");
    }
    setSubmitting(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl" style={{ background: "var(--accent)" }} />
      </div>

      <div className="relative z-10 w-full max-w-sm px-4">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex items-center gap-2">
            <Activity className="w-7 h-7" style={{ color: "var(--accent)" }} />
            <span className="text-xl font-bold tracking-tight text-gray-800">Gridge</span>
          </div>
          <p className="text-sm text-gray-500">비밀번호 변경</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-5 h-5" style={{ color: "var(--accent)" }} />
            <h2 className="text-xl font-bold text-gray-900">비밀번호 변경</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">첫 로그인 시 비밀번호를 변경해야 합니다.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">현재 비밀번호</label>
              <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                placeholder="관리자에게 받은 임시 비밀번호" required autoComplete="current-password"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white/60 border border-white/80 text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-200" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">새 비밀번호</label>
              <div className="relative">
                <input type={showNew ? "text" : "password"} value={newPw} onChange={e => setNewPw(e.target.value)}
                  placeholder="8자 이상" required autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl bg-white/60 border border-white/80 text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-200" />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPw && (
                <div className="flex items-center gap-1 mt-1">
                  <div className={`w-2 h-2 rounded-full ${passwordValid ? "bg-emerald-500" : "bg-red-400"}`} />
                  <span className={`text-[10px] ${passwordValid ? "text-emerald-600" : "text-red-500"}`}>
                    {passwordValid ? "8자 이상" : `${8 - newPw.length}자 더 필요`}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">비밀번호 확인</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                placeholder="새 비밀번호 다시 입력" required autoComplete="new-password"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white/60 border border-white/80 text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-200" />
              {confirmPw && (
                <div className="flex items-center gap-1 mt-1">
                  <div className={`w-2 h-2 rounded-full ${passwordMatch ? "bg-emerald-500" : "bg-red-400"}`} />
                  <span className={`text-[10px] ${passwordMatch ? "text-emerald-600" : "text-red-500"}`}>
                    {passwordMatch ? "일치" : "불일치"}
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-100">{error}</div>
            )}

            <button type="submit" disabled={submitting || !passwordValid || !passwordMatch}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: "var(--accent)" }}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {submitting ? "변경 중..." : "비밀번호 변경"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
