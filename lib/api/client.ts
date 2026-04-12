const API_MODE = process.env.NEXT_PUBLIC_API_MODE ?? "mock";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// 허용된 API 도메인 (환경변수 변조 방지)
const ALLOWED_API_HOSTS = ["localhost", "127.0.0.1", "gridge"];

function validateApiUrl(url: string): boolean {
  if (!url) return true; // 빈 URL은 mock 모드
  try {
    const parsed = new URL(url);
    return ALLOWED_API_HOSTS.some(h => parsed.hostname.includes(h));
  } catch {
    return false;
  }
}

export type ApiResponse<T> = {
  data: T;
  error?: never;
} | {
  data?: never;
  error: { code: string; message: string };
};

/** CSRF 토큰 (서버가 메타 태그 또는 쿠키로 제공) */
function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  // 1순위: meta 태그
  const meta = document.querySelector('meta[name="csrf-token"]');
  if (meta) return meta.getAttribute("content") || "";
  // 2순위: 쿠키
  const match = document.cookie.match(/(?:^|; )_csrf=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  if (!validateApiUrl(API_URL)) {
    return { error: { code: "INVALID_API_URL", message: "허용되지 않는 API URL입니다." } };
  }

  const url = `${API_URL}${path}`;
  const csrfToken = getCsrfToken();

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        ...options.headers,
      },
      credentials: "include",
    });

    // 인증 만료 시 로그인 페이지로
    if (res.status === 401 && typeof window !== "undefined") {
      window.location.href = "/production/login";
      return { error: { code: "UNAUTHORIZED", message: "세션이 만료되었습니다." } };
    }

    const body = await res.json();

    if (!res.ok) {
      return {
        error: {
          code: body.error ?? "UNKNOWN_ERROR",
          message: body.message ?? `HTTP ${res.status}`,
        },
      };
    }

    return { data: body as T };
  } catch (err) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Network error",
      },
    };
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) =>
    request<T>(path, { method: "DELETE" }),
};

export function isMockMode() {
  return API_MODE === "mock";
}
