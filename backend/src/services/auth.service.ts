import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { env, isTest } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { createRecord, findOneRecord, findRecordById, updateRecord } from "../utils/repository.js";
import { computeProfileCompleteness } from "./profile.service.js";
import { sendEmail } from "./email.service.js";

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
  const lowercaseEmail = email.toLowerCase().trim();
  const user = await findOneRecord("users", { email: lowercaseEmail });
  
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  if (user) {
    await updateRecord("users", String(user._id), {
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: expires
    });
  }

  const clientUrl = env.CLIENT_URL || "http://localhost:3000";
  const resetUrl = `${clientUrl}/auth/reset-password?token=${token}`;

  let emailSent = false;
  let emailResult: any = null;

  if (user) {
    try {
      emailResult = await sendEmail({
        to: user.email,
        subject: "Password Reset Link - AI Job Copilot",
        text: `You requested a password reset for your AI Job Copilot account. Please click the link below or paste it into your browser to reset your password. This link will expire in 1 hour.\n\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.`,
        html: `<p>You requested a password reset for your AI Job Copilot account.</p><p>Please click the link below to reset your password. This link will expire in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, you can safely ignore this email.</p>`
      });
      emailSent = emailResult?.sent || false;
    } catch (err) {
      // Do not crash
    }
  } else {
    // Simulate similar workload time to prevent timing analysis
    await new Promise((resolve) => setTimeout(resolve, isTest ? 1 : 50 + Math.random() * 50));
  }

  const response: { success: boolean; message: string; token?: string } = {
    success: true,
    message: "If an account is associated with this email, reset instructions have been sent by the configured provider."
  };

  const isProviderConfigured = env.EMAIL_PROVIDER !== "mock" && emailSent;

  if (!isProviderConfigured) {
    if (env.NODE_ENV !== "production") {
      response.message = `If an account exists, password reset instructions will be sent. [Dev Fallback Mode: Email provider not configured. Reset Link: ${resetUrl}]`;
      response.token = token;
    }
  }

  return response;
}

export async function resetPassword(token: string, password: string) {
  if (!token) throw new ApiError(400, "Reset token is required");
  if (!password) throw new ApiError(400, "New password is required");

  // Enforce password validation rules inside service
  const hasMinLen = password.length >= 8;
  const hasMaxLen = password.length <= 128;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);

  if (!hasMinLen || !hasMaxLen || !hasUpper || !hasLower || !hasDigit) {
    throw new ApiError(400, "Password does not meet complexity requirements");
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await findOneRecord("users", {
    passwordResetTokenHash: tokenHash
  });

  if (!user || !user.passwordResetExpires || new Date(user.passwordResetExpires).getTime() <= Date.now()) {
    throw new ApiError(400, "Password reset token is invalid or has expired");
  }

  const passwordHash = await bcrypt.hash(password, passwordHashRounds);

  await updateRecord("users", String(user._id), {
    passwordHash,
    passwordChangedAt: new Date(),
    passwordResetTokenHash: null,
    passwordResetExpires: null,
    failedLoginAttempts: 0,
    lockedUntil: null
  });

  return {
    reset: true,
    message: "Your password has been successfully reset. You can now log in with your new password."
  };
}

export async function upsertGoogleUser(profile: { email: string; fullName: string; id: string; avatarUrl?: string }) {
  let user = await findOneRecord("users", { email: profile.email.toLowerCase() });
  if (!user) {
    const dummyPassword = Math.random().toString(36) + "A1!";
    const passwordHash = await bcrypt.hash(dummyPassword, passwordHashRounds);
    user = await createRecord("users", {
      fullName: profile.fullName,
      email: profile.email.toLowerCase(),
      passwordHash,
      role: "job_seeker",
      isEmailVerified: true,
      failedLoginAttempts: 0,
      googleId: profile.id,
      avatarUrl: profile.avatarUrl,
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
  } else {
    await updateRecord("users", String(user._id), {
      googleId: profile.id,
      avatarUrl: profile.avatarUrl || user.avatarUrl,
      isEmailVerified: true
    });
  }
  const tokens = signTokens(user);
  await updateRecord("users", String(user._id), { refreshTokenHash: await bcrypt.hash(tokens.refreshToken, passwordHashRounds), lastLoginAt: new Date() });
  return { user: sanitize({ ...user, lastLoginAt: new Date() }), ...tokens };
}

export async function disconnectGoogle(userId: string) {
  const user = await findRecordById("users", userId);
  if (!user) throw new ApiError(404, "User not found");
  await updateRecord("users", userId, { googleId: undefined });
  return { ok: true };
}
