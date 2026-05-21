import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody } from "../middlewares/validate.js";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "../validators/auth.validator.js";
import { forgotPassword, getMe, loginUser, logoutUser, refreshSession, registerUser, resetPassword } from "../services/auth.service.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { isProduction, isTest } from "../config/env.js";

const router = Router();
const cookieOptions = { httpOnly: true, secure: isProduction, sameSite: "lax" as const, path: "/" };
const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 20, standardHeaders: true, legacyHeaders: false, skip: () => isTest });

function setAuthCookies(res: any, accessToken: string, refreshToken: string) {
  res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

router.post("/register", authLimiter, validateBody(registerSchema), asyncHandler(async (req, res) => {
  const result = await registerUser(req.body);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  res.status(201).json({ success: true, data: result });
}));

router.post("/login", authLimiter, validateBody(loginSchema), asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  res.json({ success: true, data: result });
}));

router.post("/logout", requireAuth, asyncHandler(async (req, res) => {
  await logoutUser(req.user?.id);
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
  res.json({ success: true, data: { ok: true } });
}));

router.post("/refresh", asyncHandler(async (req, res) => {
  const result = await refreshSession(req.cookies?.refreshToken || req.body.refreshToken);
  setAuthCookies(res, result.accessToken, result.refreshToken);
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

export default router;
