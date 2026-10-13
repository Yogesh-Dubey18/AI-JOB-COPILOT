import { Router } from "express";
import rateLimit from "express-rate-limit";
import { randomBytes } from "node:crypto";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody } from "../middlewares/validate.js";
import { forgotPasswordSchema, loginSchema, oauthHandoffSchema, registerSchema, resetPasswordSchema } from "../validators/auth.validator.js";
import { createOAuthHandoff, exchangeOAuthHandoff, forgotPassword, getMe, loginUser, logoutUser, refreshSession, registerUser, resetPassword, upsertGoogleUser, disconnectGoogle, verifyEmailToken, verifyOAuthState } from "../services/auth.service.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { env, isProduction, isTest } from "../config/env.js";

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 20, standardHeaders: true, legacyHeaders: false, skip: () => isTest });

function getCookieOptions(req: any) {
  const isProd = env.NODE_ENV === "production";
  const origin = req.headers.origin || req.headers.referer;
  const host = req.headers.host;
  
  let sameSite: "none" | "lax" = isProd ? "none" : "lax";
  let domain: string | undefined = undefined;

  if (isProd && origin && host) {
    try {
      const originHostname = new URL(origin).hostname;
      const hostHostname = host.split(":")[0];
      
      const originParts = originHostname.split(".");
      const hostParts = hostHostname.split(".");
      
      if (originParts.length >= 2 && hostParts.length >= 2) {
        const originPrimary = originParts.slice(-2).join(".");
        const hostPrimary = hostParts.slice(-2).join(".");
        
        if (originPrimary === hostPrimary) {
          sameSite = "lax";
          domain = `.${originPrimary}`;
        }
      }
    } catch (e) {
      // ignore URL parsing failures
    }
  }

  return {
    httpOnly: true,
    secure: isProd,
    sameSite,
    domain,
    path: "/"
  };
}

function setAuthCookies(req: any, res: any, accessToken: string, refreshToken: string) {
  const options = getCookieOptions(req);
  res.cookie("accessToken", accessToken, { ...options, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...options, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

function frontendOrigin() {
  return env.CLIENT_URL.split(",")[0]?.trim() || "http://localhost:3000";
}

function googleRedirectUri(req: any) {
  return env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get("host")}/api/auth/google/callback`;
}

function noStoreAuthRedirect(res: any) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
}

router.post("/register", authLimiter, validateBody(registerSchema), asyncHandler(async (req, res) => {
  const result = await registerUser(req.body);
  setAuthCookies(req, res, result.accessToken, result.refreshToken);
  res.status(201).json({ success: true, data: result });
}));

router.post("/login", authLimiter, validateBody(loginSchema), asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);
  setAuthCookies(req, res, result.accessToken, result.refreshToken);
  res.json({ success: true, data: result });
}));

router.post("/logout", requireAuth, asyncHandler(async (req, res) => {
  await logoutUser(req.user?.id);
  const options = getCookieOptions(req);
  res.clearCookie("accessToken", options);
  res.clearCookie("refreshToken", options);
  res.json({ success: true, data: { ok: true } });
}));

router.post("/refresh", asyncHandler(async (req, res) => {
  const result = await refreshSession(req.cookies?.refreshToken || req.body.refreshToken);
  setAuthCookies(req, res, result.accessToken, result.refreshToken);
  res.json({ success: true, data: result });
}));

router.post("/google/exchange", authLimiter, validateBody(oauthHandoffSchema), asyncHandler(async (req, res) => {
  const result = await exchangeOAuthHandoff(req.body.code);
  setAuthCookies(req, res, result.accessToken, result.refreshToken);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.json({ success: true, data: result });
}));

router.get("/me", requireAuth, asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getMe(req.user!.id) });
}));

router.post("/forgot-password", authLimiter, validateBody(forgotPasswordSchema), asyncHandler(async (req, res) => {
  res.json({ success: true, data: await forgotPassword(req.body.email) });
}));

router.post("/reset-password", authLimiter, validateBody(resetPasswordSchema), asyncHandler(async (req, res) => {
  res.json({ success: true, data: await resetPassword(req.body.token, req.body.password) });
}));

router.post("/verify-email", authLimiter, asyncHandler(async (req, res) => {
  res.json({ success: true, data: await verifyEmailToken(req.body.token) });
}));

router.get("/providers/status", asyncHandler(async (_req, res) => {
  const googleConfigured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  
  const isSendGridLive = Boolean(env.SENDGRID_API_KEY);
  const isSmtpLive = Boolean(env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASS);
  const emailLive = (env.EMAIL_PROVIDER === "sendgrid" && isSendGridLive) || 
                      (env.EMAIL_PROVIDER === "smtp" && isSmtpLive);
  
  let emailStatus: "live" | "ready" | "not_configured" = "not_configured";
  if (emailLive) {
    emailStatus = "live";
  } else {
    const sendgridExists = typeof process.env.SENDGRID_API_KEY !== "undefined";
    const smtpExists = typeof process.env.SMTP_HOST !== "undefined" || typeof process.env.EMAIL_HOST !== "undefined";
    if (sendgridExists || smtpExists) {
      emailStatus = "ready";
    }
  }

  let googleStatus: "live" | "ready" | "not_configured" = "not_configured";
  if (googleConfigured) {
    googleStatus = "live";
  } else {
    const googleIdExists = typeof process.env.GOOGLE_CLIENT_ID !== "undefined";
    const googleSecretExists = typeof process.env.GOOGLE_CLIENT_SECRET !== "undefined";
    if (googleIdExists || googleSecretExists) {
      googleStatus = "ready";
    }
  }

  res.json({
    success: true,
    data: {
      google: {
        configured: googleConfigured,
        status: googleStatus
      },
      email: {
        configured: emailLive,
        provider: env.EMAIL_PROVIDER,
        status: emailStatus
      }
    }
  });
}));

router.get("/google", asyncHandler(async (req, res) => {
  const configured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  if (!configured) {
    noStoreAuthRedirect(res);
    return res.redirect(`${frontendOrigin()}/login?error=Google%20OAuth%20credentials%20not%20configured`);
  }
  const state = randomBytes(32).toString("hex");
  res.cookie("googleOAuthState", state, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 5 * 60 * 1000,
    path: "/api/auth/google/callback"
  });
  noStoreAuthRedirect(res);
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: googleRedirectUri(req),
    response_type: "code",
    scope: "email profile",
    state
  }).toString();
  res.redirect(authUrl.toString());
}));

router.get("/google/callback", asyncHandler(async (req, res) => {
  noStoreAuthRedirect(res);
  const configured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  if (!configured) {
    return res.redirect(`${frontendOrigin()}/login?error=Google%20OAuth%20credentials%20not%20configured`);
  }
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const stateCookie = typeof req.cookies?.googleOAuthState === "string" ? req.cookies.googleOAuthState : "";
  res.clearCookie("googleOAuthState", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google/callback"
  });
  if (!verifyOAuthState(state, stateCookie)) {
    return res.redirect(`${frontendOrigin()}/login?error=google_oauth_failed`);
  }

  const code = req.query.code;
  if (typeof code !== "string" || !code || req.query.error) {
    return res.redirect(`${frontendOrigin()}/login?error=google_oauth_failed`);
  }
  try {
    const redirectUri = googleRedirectUri(req);
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });
    if (!response.ok) throw new Error("Failed to exchange authorization code");
    const tokenData = await response.json();
    
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    if (!profileRes.ok) throw new Error("Failed to fetch user profile from Google");
    const googleProfile = await profileRes.json();
    
    const result = await upsertGoogleUser({
      id: googleProfile.id,
      email: googleProfile.email,
      fullName: googleProfile.name || googleProfile.given_name || "Google User",
      avatarUrl: googleProfile.picture
    });

    const handoff = await createOAuthHandoff(result.user.id);
    res.redirect(`${frontendOrigin()}/login#oauth_code=${encodeURIComponent(handoff)}`);
  } catch {
    return res.redirect(`${frontendOrigin()}/login?error=google_oauth_failed`);
  }
}));

router.post("/google/disconnect", requireAuth, asyncHandler(async (req, res) => {
  res.json({ success: true, data: await disconnectGoogle(req.user!.id) });
}));

export default router;
