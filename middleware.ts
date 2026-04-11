import { NextRequest, NextResponse } from "next/server";

/**
 * 라우트 보호 미들웨어
 * - 미인증 → /production/login 리다이렉트
 * - 역할별 접근 제어 (super_admin / admin / team_lead / member)
 * - 토큰: "gridge_session" 쿠키에 저장된 세션 토큰
 * - 역할: "gridge_role" 쿠키에 저장된 역할 (백엔드가 로그인 시 설정)
 */

const PUBLIC_PATHS = [
  "/production/login",
  "/",
  "/admin",         // 데모
  "/developer",     // 데모
];

const ROLE_ROUTES: Record<string, string[]> = {
  super_admin: ["/production/super-admin"],
  admin:       ["/production/admin"],
  team_lead:   ["/production/team-lead"],
  member:      ["/production/developer"],
};

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"));
}

function isProductionRoute(pathname: string) {
  return pathname.startsWith("/production");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 파일, API, 데모 경로는 통과
  if (!isProductionRoute(pathname) || pathname.startsWith("/production/login")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("gridge_session")?.value;
  const role = request.cookies.get("gridge_role")?.value;

  // 미인증 → 로그인
  if (!token) {
    const loginUrl = new URL("/production/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 역할별 접근 제어
  if (role) {
    const allowed = ROLE_ROUTES[role];
    if (allowed) {
      const hasAccess = allowed.some(prefix => pathname.startsWith(prefix));
      if (!hasAccess) {
        // 권한 없는 경로 → 자기 홈으로 리다이렉트
        const home = allowed[0] ?? "/production/login";
        return NextResponse.redirect(new URL(home, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/production/:path*"],
};
