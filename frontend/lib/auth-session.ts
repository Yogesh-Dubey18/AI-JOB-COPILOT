const ACCESS_TOKEN_KEY = "ajc_access_token";
const USER_KEY = "ajc_user";
const SESSION_COOKIE = "ajc_session";
const DEFAULT_SESSION_SECONDS = 15 * 60;

type AuthPayload = {
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  user?: unknown;
  data?: AuthPayload;
};

function browserAvailable() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function asAuthPayload(value: unknown): AuthPayload {
  if (!value || typeof value !== "object") return {};
  const payload = value as AuthPayload;
  return payload.data && typeof payload.data === "object" ? { ...payload.data, ...payload } : payload;
}

function getJwtMaxAgeSeconds(token: string) {
  try {
    const [, payload] = token.split(".");
    if (!payload) return DEFAULT_SESSION_SECONDS;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(window.atob(normalized)) as { exp?: number };
    if (!decoded.exp) return DEFAULT_SESSION_SECONDS;
    const seconds = Math.floor(decoded.exp - Date.now() / 1000);
    return Math.max(60, Math.min(seconds, 7 * 24 * 60 * 60));
  } catch {
    return DEFAULT_SESSION_SECONDS;
  }
}

function setSessionCookie(accessToken?: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const maxAge = 7 * 24 * 60 * 60; // 7 days (matching refresh token)
  document.cookie = `${SESSION_COOKIE}=1; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  if (accessToken) {
    document.cookie = `accessToken=${accessToken}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  }
}

export function getStoredAccessToken() {
  if (!browserAvailable()) return undefined;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) || window.sessionStorage.getItem(ACCESS_TOKEN_KEY) || undefined;
}

let refreshTimer: any = null;

function clearProactiveRefreshTimer() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

const API_URL = (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) || "http://localhost:5000/api";

function scheduleProactiveRefresh(accessToken: string) {
  clearProactiveRefreshTimer();
  if (!browserAvailable()) return;

  try {
    const [, payload] = accessToken.split(".");
    if (!payload) return;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(window.atob(normalized)) as { exp?: number };
    if (!decoded.exp) return;
    
    const expiryTime = decoded.exp * 1000;
    const timeUntilExpiry = expiryTime - Date.now();
    
    // Refresh 3 minutes (180,000 ms) before expiry
    const refreshDelay = timeUntilExpiry - 180000;
    const delay = Math.max(1000, refreshDelay);

    if (timeUntilExpiry > 0) {
      refreshTimer = setTimeout(async () => {
        try {
          const res = await fetch(API_URL + "/auth/refresh", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" }
          });
          if (res.ok) {
            const refreshPayload = await res.json().catch(() => ({}));
            const result = refreshPayload.data || refreshPayload;
            persistAuthSession(result);
          } else {
            clearAuthSession();
          }
        } catch {
          // If network is offline, retry in 30 seconds
          setTimeout(() => {
            scheduleProactiveRefresh(accessToken);
          }, 30000);
        }
      }, delay);
    }
  } catch (err) {
    // Ignore parsing errors
  }
}

export function persistAuthSession(value: unknown) {
  if (!browserAvailable()) return false;
  const payload = asAuthPayload(value);
  const accessToken = payload.accessToken || payload.token;
  if (!accessToken) return false;

  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (payload.user) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  }
  setSessionCookie(accessToken);
  scheduleProactiveRefresh(accessToken);
  return true;
}

export function clearAuthSession() {
  if (!browserAvailable()) return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.sessionStorage.removeItem(USER_KEY);
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `accessToken=; Path=/; Max-Age=0; SameSite=Lax`;
  clearProactiveRefreshTimer();
}

// Initialise scheduling if token exists on load
if (browserAvailable()) {
  const token = getStoredAccessToken();
  if (token) {
    scheduleProactiveRefresh(token);
  }
}
