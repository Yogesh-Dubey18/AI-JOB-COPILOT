import { getStoredAccessToken, persistAuthSession, clearAuthSession } from "./auth-session";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export type ApiEnvelope<T> = { success: boolean; data: T; message?: string };

export class ApiClientError extends Error {
  statusCode: number;
  requestId?: string;

  constructor(message: string, statusCode: number, requestId?: string) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.requestId = requestId;
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isForm = options.body instanceof FormData;
  let accessToken = getStoredAccessToken();
  
  const headers: HeadersInit = {
    ...(isForm ? {} : { "Content-Type": "application/json" }),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options.headers || {})
  };

  let response = await fetch(API_URL + path, {
    ...options,
    credentials: "include",
    headers
  });

  let payload = await response.json().catch(() => ({}));
  let requestId = response.headers.get("x-request-id") || payload.requestId;

  if (response.status === 401 && !path.startsWith("/auth/login") && !path.startsWith("/auth/register") && !path.startsWith("/auth/refresh")) {
    try {
      if (!refreshPromise) {
        refreshPromise = (async () => {
          const res = await fetch(API_URL + "/auth/refresh", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" }
          });
          if (!res.ok) throw new Error("Refresh token expired or invalid");
          const refreshPayload = await res.json().catch(() => ({}));
          const result = refreshPayload.data || refreshPayload;
          const token = result.accessToken || result.token;
          if (token) {
            persistAuthSession(result);
            return token;
          }
          throw new Error("No token returned from refresh endpoint");
        })().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        // Retry the request with the new token
        const retryHeaders: HeadersInit = {
          ...(isForm ? {} : { "Content-Type": "application/json" }),
          Authorization: `Bearer ${newToken}`,
          ...(options.headers || {})
        };
        response = await fetch(API_URL + path, {
          ...options,
          credentials: "include",
          headers: retryHeaders
        });
        payload = await response.json().catch(() => ({}));
        requestId = response.headers.get("x-request-id") || payload.requestId;
      }
    } catch (refreshErr) {
      clearAuthSession();
      throw new ApiClientError("Session expired", 401, requestId);
    }
  }

  if (!response.ok) throw new ApiClientError(payload.message || "Request failed", response.status, requestId);
  return (payload && typeof payload === "object" && "data" in payload ? payload.data : payload) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: body instanceof FormData ? body : JSON.stringify(body || {}) }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body || {}) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body || {}) }),
  delete: <T>(path: string, body?: unknown) => request<T>(path, { method: "DELETE", body: body ? JSON.stringify(body) : undefined })
};
