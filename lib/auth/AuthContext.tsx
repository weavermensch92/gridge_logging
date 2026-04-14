"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { User, UserRole } from "@/types";
import { authApi } from "@/lib/api";
import { isMockMode } from "@/lib/api/client";

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{
    success: boolean;
    mustChangePassword?: boolean;
    role?: UserRole;
    error?: string;
  }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

/**
 * 쿠키 유틸
 *
 * 보안 참고:
 * - gridge_session 토큰은 실제로는 서버가 Set-Cookie: HttpOnly; Secure로 설정해야 함
 * - 클라이언트에서는 gridge_role (비민감) 쿠키만 설정
 * - 현재 Mock 모드에서는 클라이언트 쿠키 사용 (프로덕션에서는 서버 Set-Cookie로 전환)
 */
function setCookie(name: string, value: string, days = 1) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Strict${secure}`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      // mock 모드에서는 쿠키에 저장된 토큰이 있으면 유저 정보 조회
      const token = getCookie("gridge_session");
      if (!token && !isMockMode()) {
        setUser(null);
        setLoading(false);
        return;
      }

      const res = await authApi.me();
      if (res.data) {
        setUser(res.data);
      } else {
        setUser(null);
        deleteCookie("gridge_session");
        deleteCookie("gridge_role");
      }
    } catch {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await authApi.login(email, password);
      if (res.data) {
        const { user: loggedInUser, token } = res.data;
        setUser(loggedInUser);

        // 세션 토큰 + 역할을 쿠키에 저장 (middleware에서 읽음)
        setCookie("gridge_session", token);
        setCookie("gridge_role", loggedInUser.role);

        return {
          success: true,
          mustChangePassword: (loggedInUser as User & { must_change_password?: boolean }).must_change_password,
          role: loggedInUser.role,
        };
      }
      return { success: false, error: res.error?.message ?? "로그인에 실패했습니다." };
    } catch {
      return { success: false, error: "서버에 연결할 수 없습니다." };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch { /* ignore */ }
    setUser(null);
    deleteCookie("gridge_session");
    deleteCookie("gridge_role");
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
