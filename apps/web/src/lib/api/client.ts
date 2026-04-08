/**
 * Typed fetch wrapper for the DA Apparels API.
 * Automatically attaches Authorization header from the in-memory token store,
 * and silently refreshes the access token when a 401 is returned.
 */

import type { ApiResponse } from "@/lib/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

// In-memory token — never stored in localStorage (XSS risk).
// The refresh token lives in an HttpOnly cookie managed by the browser.
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include", // sends the HttpOnly refresh cookie
    });
    if (!res.ok) return false;
    const json = (await res.json()) as ApiResponse<{ accessToken: string }>;
    if (json.success && json.data?.accessToken) {
      accessToken = json.data.accessToken;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiRequest<T>(
  path: string,
  options: FetchOptions = {},
): Promise<ApiResponse<T>> {
  const { skipAuth = false, ...init } = options;

  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (!skipAuth && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let res: Response;

  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
  } catch {
    return {
      success: false,
      message: "We could not reach the DA Apparels server. Please try again shortly.",
    };
  }

  // Token expired — attempt silent refresh once
  if (res.status === 401 && !skipAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed && accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
      try {
        res = await fetch(`${BASE}${path}`, { ...init, headers, credentials: "include" });
      } catch {
        return {
          success: false,
          message: "We could not reach the DA Apparels server. Please try again shortly.",
        };
      }
    }
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return {
      success: res.ok,
      message: res.ok ? undefined : "The server returned an unexpected response.",
    };
  }

  return res.json() as Promise<ApiResponse<T>>;
}

// Convenience helpers
export const api = {
  get: <T>(path: string, opts?: FetchOptions) =>
    apiRequest<T>(path, { method: "GET", ...opts }),

  post: <T>(path: string, body: unknown, opts?: FetchOptions) =>
    apiRequest<T>(path, { method: "POST", body: JSON.stringify(body), ...opts }),

  patch: <T>(path: string, body: unknown, opts?: FetchOptions) =>
    apiRequest<T>(path, { method: "PATCH", body: JSON.stringify(body), ...opts }),

  put: <T>(path: string, body: unknown, opts?: FetchOptions) =>
    apiRequest<T>(path, { method: "PUT", body: JSON.stringify(body), ...opts }),

  del: <T>(path: string, opts?: FetchOptions) =>
    apiRequest<T>(path, { method: "DELETE", ...opts }),
};
