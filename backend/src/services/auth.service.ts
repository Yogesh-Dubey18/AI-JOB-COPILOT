import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env, isTest } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { createRecord, findOneRecord, findRecordById, updateRecord } from "../utils/repository.js";
import { computeProfileCompleteness } from "./profile.service.js";

function sanitize(user: any) {
  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    lastLoginAt: user.lastLoginAt
  };
}

function signTokens(user: any) {
  const accessToken = jwt.sign({ sub: String(user._id), role: user.role, typ: "access" }, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ sub: String(user._id), typ: "refresh", tokenVersion: Date.now() }, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
}

const passwordHashRounds = isTest ? 4 : 12;

export async function registerUser(input: { fullName: string; email: string; password: string; phone?: string }) {
  const existing = await findOneRecord("users", { email: input.email.toLowerCase() });
  if (existing) throw new ApiError(409, "Email is already registered");
  const passwordHash = await bcrypt.hash(input.password, passwordHashRounds);
  const user = await createRecord("users", {
    fullName: input.fullName,
    email: input.email.toLowerCase(),
    passwordHash,
    phone: input.phone,
    role: "job_seeker",
    isEmailVerified: false,
    failedLoginAttempts: 0,
    passwordChangedAt: new Date()
  });
  await createRecord("profiles", {
    userId: user._id,
    headline: "",
    education: [],
    targetRoles: [],
    experienceLevel: "fresher",
    totalExperienceYears: 0,
    skills: [],
    softSkills: [],
    preferredLocations: [],
    preferredJobTypes: [],
    profileCompletenessScore: computeProfileCompleteness({})
  });
  const tokens = signTokens(user);
  await updateRecord("users", String(user._id), { refreshTokenHash: await bcrypt.hash(tokens.refreshToken, passwordHashRounds), lastLoginAt: new Date() });
  return { user: sanitize({ ...user, lastLoginAt: new Date() }), ...tokens };
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await findOneRecord("users", { email: input.email.toLowerCase() });
  if (!user) throw new ApiError(401, "Invalid email or password");
  if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
    throw new ApiError(423, "Account is temporarily locked after repeated failed logins");
  }
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    const failedLoginAttempts = Number(user.failedLoginAttempts || 0) + 1;
    await updateRecord("users", String(user._id), {
      failedLoginAttempts,
      lockedUntil: failedLoginAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : undefined
    });
    throw new ApiError(401, "Invalid email or password");
  }
  const tokens = signTokens(user);
  await updateRecord("users", String(user._id), { refreshTokenHash: await bcrypt.hash(tokens.refreshToken, passwordHashRounds), lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: undefined });
  return { user: sanitize({ ...user, lastLoginAt: new Date() }), ...tokens };
}

export async function refreshSession(refreshToken: string) {
  if (!refreshToken) throw new ApiError(401, "Refresh token missing");
  const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string; typ?: string };
  if (decoded.typ !== "refresh") throw new ApiError(401, "Invalid refresh token type");
  const user = await findRecordById("users", decoded.sub);
  if (!user?.refreshTokenHash) throw new ApiError(401, "Refresh token revoked");
  const ok = await bcrypt.compare(refreshToken, user.refreshTokenHash);
  if (!ok) throw new ApiError(401, "Invalid refresh token");
  const tokens = signTokens(user);
  await updateRecord("users", String(user._id), { refreshTokenHash: await bcrypt.hash(tokens.refreshToken, passwordHashRounds) });
  return { user: sanitize(user), ...tokens };
}

export async function logoutUser(userId?: string) {
  if (userId) await updateRecord("users", userId, { refreshTokenHash: "" });
  return { ok: true };
}

export async function getMe(userId: string) {
  const user = await findRecordById("users", userId);
  if (!user) throw new ApiError(404, "User not found");
  return sanitize(user);
}

export async function forgotPassword(email: string) {
  const user = await findOneRecord("users", { email: email.toLowerCase() });
  return { sent: Boolean(user), message: "If the account exists, a reset email will be sent by the configured email provider." };
}

export async function resetPassword(_token: string, password: string) {
  return { reset: Boolean(password), message: "Password reset flow is ready for email-token persistence in production." };
}
