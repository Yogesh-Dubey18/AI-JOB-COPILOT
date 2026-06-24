import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody } from "../middlewares/validate.js";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "../validators/auth.validator.js";
import { forgotPassword, getMe, loginUser, logoutUser, refreshSession, registerUser, resetPassword, upsertGoogleUser, disconnectGoogle, verifyEmailToken } from "../services/auth.service.js";
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
    return res.redirect(`${env.CLIENT_URL || "http://localhost:3000"}/login?error=Google OAuth credentials not configured`);
  }
  const clientUrl = env.CLIENT_URL || "http://localhost:3000";
  const redirectUri = env.GOOGLE_REDIRECT_URI || `${clientUrl}/api/auth/google/callback`;
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email%20profile`;
  res.redirect(authUrl);
}));

router.get("/google/callback", asyncHandler(async (req, res) => {
  const configured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  if (!configured) {
    return res.redirect(`${env.CLIENT_URL || "http://localhost:3000"}/login?error=Google OAuth credentials not configured`);
  }
  const code = req.query.code;
  if (!code) {
    return res.redirect(`${env.CLIENT_URL || "http://localhost:3000"}/login?error=Google authentication failed`);
  }
  try {
    const clientUrl = env.CLIENT_URL || "http://localhost:3000";
    const redirectUri = env.GOOGLE_REDIRECT_URI || `${clientUrl}/api/auth/google/callback`;
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

    setAuthCookies(req, res, result.accessToken, result.refreshToken);
    res.redirect(`${env.CLIENT_URL || "http://localhost:3000"}/login?googleToken=${result.accessToken}`);
  } catch (error) {
    return res.redirect(`${env.CLIENT_URL || "http://localhost:3000"}/login?error=Google authentication failed`);
  }
}));

router.post("/google/disconnect", requireAuth, asyncHandler(async (req, res) => {
  res.json({ success: true, data: await disconnectGoogle(req.user!.id) });
}));

export default router;
