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

function setSessionCookie(accessToken: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SESSION_COOKIE}=1; Path=/; Max-Age=${getJwtMaxAgeSeconds(accessToken)}; SameSite=Lax${secure}`;
}

export function getStoredAccessToken() {
  if (!browserAvailable()) return undefined;
  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY) || undefined;
}

export function persistAuthSession(value: unknown) {
  if (!browserAvailable()) return false;
  const payload = asAuthPayload(value);
  const accessToken = payload.accessToken || payload.token;
  if (!accessToken) return false;

  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (payload.user) window.sessionStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  setSessionCookie(accessToken);
  return true;
}

export function clearAuthSession() {
  if (!browserAvailable()) return;
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(USER_KEY);
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
