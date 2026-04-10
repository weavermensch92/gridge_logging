const API_MODE = process.env.NEXT_PUBLIC_API_MODE ?? "mock";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export type ApiResponse<T> = {
  data: T;
  error?: never;
} | {
  data?: never;
  error: { code: string; message: string };
};

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const url = `${API_URL}${path}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include",
    });

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
