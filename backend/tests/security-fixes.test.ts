import crypto from "node:crypto";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { env } from "../src/config/env.js";
import { csrfOriginCheck } from "../src/middlewares/csrf.middleware.js";
import { sanitizeUpdate } from "../src/utils/sanitizeUpdate.js";
import { resetMemoryStore } from "../src/utils/memoryStore.js";
import { createRecord, findOneRecord, findRecordById, updateRecord } from "../src/utils/repository.js";

async function register(email: string) {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/register").send({ fullName: "Sec User", email, password: "Password123!" }).expect(201);
  return { agent, user: res.body.data.user, refreshToken: res.body.data.refreshToken as string };
}

describe("security fixes", () => {
  beforeEach(() => resetMemoryStore());

  describe("billing mock activation", () => {
    it("allows a normal mock plan but never the admin plan", async () => {
      const { agent } = await register("bill@example.com");
      await agent.post("/api/billing/mock/activate").send({ planId: "pro" }).expect(200);
      await agent.post("/api/billing/mock/activate").send({ planId: "admin" }).expect(403);
    });

    it("is disabled when a live billing provider is configured", async () => {
      const { agent } = await register("bill2@example.com");
      const original = { p: env.BILLING_PROVIDER, k: env.STRIPE_SECRET_KEY };
      env.BILLING_PROVIDER = "stripe";
      env.STRIPE_SECRET_KEY = "sk_test_dummy";
      try {
        await agent.post("/api/billing/mock/activate").send({ planId: "pro" }).expect(403);
      } finally {
        env.BILLING_PROVIDER = original.p;
        env.STRIPE_SECRET_KEY = original.k;
      }
    });
  });

  describe("email verification", () => {
    it("rejects operator objects and malformed tokens", async () => {
      await request(app).post("/api/auth/verify-email").send({ token: { $ne: "" } }).expect(422);
      await request(app).post("/api/auth/verify-email").send({ token: "short" }).expect(422);
    });

    it("rejects an unknown but well-formed token", async () => {
      await request(app).post("/api/auth/verify-email").send({ token: "a".repeat(64) }).expect(400);
    });

    it("rejects expired tokens and leaves the user unverified", async () => {
      const { user } = await register("exp@example.com");
      const token = crypto.randomBytes(32).toString("hex");
      const record = await createRecord("emailVerificationTokens", { userId: user.id, token });
      await updateRecord("emailVerificationTokens", String(record._id), { createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) });
      await request(app).post("/api/auth/verify-email").send({ token }).expect(400);
      expect((await findRecordById("users", user.id)).isEmailVerified).toBe(false);
    });

    it("accepts a fresh token", async () => {
      const { user } = await register("fresh@example.com");
      const token = crypto.randomBytes(32).toString("hex");
      await createRecord("emailVerificationTokens", { userId: user.id, token });
      await request(app).post("/api/auth/verify-email").send({ token }).expect(200);
      expect((await findRecordById("users", user.id)).isEmailVerified).toBe(true);
    });
  });

  describe("refresh tokens", () => {
    it("rotates: the previous refresh token stops working", async () => {
      const { refreshToken } = await register("rot@example.com");
      await new Promise((r) => setTimeout(r, 1100));
      const first = await request(app).post("/api/auth/refresh").send({ refreshToken }).expect(200);
      expect(first.body.data.refreshToken).not.toBe(refreshToken);
      await request(app).post("/api/auth/refresh").send({ refreshToken }).expect(401);
      await request(app).post("/api/auth/refresh").send({ refreshToken: first.body.data.refreshToken }).expect(200);
    });

    it("is revoked by a password reset", async () => {
      const { refreshToken } = await register("reset@example.com");
      const forgot = await request(app).post("/api/auth/forgot-password").send({ email: "reset@example.com" }).expect(200);
      await request(app).post("/api/auth/reset-password").send({ token: forgot.body.data.token, password: "NewPassword123!" }).expect(200);
      await request(app).post("/api/auth/refresh").send({ refreshToken }).expect(401);
    });
  });

  describe("login lockout", () => {
    it("hides lock state and restarts counting after the lock expires", async () => {
      const { user } = await register("lockx@example.com");
      for (let i = 0; i < 5; i += 1) {
        await request(app).post("/api/auth/login").send({ email: "lockx@example.com", password: "Wrong123x" }).expect(401);
      }
      await request(app).post("/api/auth/login").send({ email: "lockx@example.com", password: "Password123!" }).expect(401);
      await updateRecord("users", user.id, { lockedUntil: new Date(Date.now() - 1000) });
      await request(app).post("/api/auth/login").send({ email: "lockx@example.com", password: "Wrong123x" }).expect(401);
      const after = await findRecordById("users", user.id);
      expect(after.failedLoginAttempts).toBe(1);
      expect(after.lockedUntil).toBeFalsy();
      await request(app).post("/api/auth/login").send({ email: "lockx@example.com", password: "Password123!" }).expect(200);
    });
  });

  describe("cross-user access", () => {
    it("does not let another user append to a chat session", async () => {
      const a = await register("chata@example.com");
      const b = await register("chatb@example.com");
      await a.agent.post("/api/ai/chat").send({ message: "hello mentor" }).expect(200);
      const session = await findOneRecord("chatSessions", { userId: a.user.id });
      expect(session).toBeTruthy();
      await b.agent.post("/api/ai/chat").send({ message: "intrude", sessionId: String(session._id) }).expect(404);
      expect((await findRecordById("chatSessions", String(session._id))).messages).toHaveLength(2);
    });

    it("ignores another user's resume version when building an application kit", async () => {
      const a = await register("kita@example.com");
      const b = await register("kitb@example.com");
      const version = await createRecord("resumeVersions", { userId: a.user.id, title: "A", content: { skills: ["SecretSkillXYZ"] } });
      const res = await b.agent.post("/api/ai/generate-application-kit").send({ job: { title: "Dev", company: "Co", description: "Build things" }, resumeVersionId: String(version._id) });
      expect(JSON.stringify(res.body)).not.toContain("SecretSkillXYZ");
    });
  });

  describe("mass assignment", () => {
    it("cannot reassign an application to another user", async () => {
      const a = await register("appa@example.com");
      const b = await register("appb@example.com");
      const created = await a.agent.post("/api/applications").send({ company: "Co", role: "Dev", status: "Saved" }).expect(201);
      const id = created.body.data._id || created.body.data.id;
      await a.agent.patch(`/api/applications/${id}`).send({ notes: "ok", userId: b.user.id }).expect(200);
      expect(String((await findRecordById("applications", id)).userId)).toBe(a.user.id);
    });

    it("sanitizeUpdate strips identity fields and operators", () => {
      expect(sanitizeUpdate({ _id: "1", userId: "2", ownerId: "3", $set: { x: 1 }, "a.b": 1, notes: "keep" })).toEqual({ notes: "keep" });
      expect(sanitizeUpdate(null)).toEqual({});
      expect(sanitizeUpdate([1] as any)).toEqual({});
    });
  });

  describe("csrf origin check", () => {
    const run = (req: any) => {
      let result: any = "none";
      csrfOriginCheck(["https://app.example.com"], ["/api/billing/webhook"])({ originalUrl: req.path, headers: {}, cookies: {}, ...req } as any, {} as any, (err?: any) => { result = err ?? "next"; });
      return result;
    };
    it("allows safe methods, bearer auth, cookie-less requests, and the webhook", () => {
      expect(run({ method: "GET", path: "/api/x", cookies: { accessToken: "t" } })).toBe("next");
      expect(run({ method: "POST", path: "/api/x", headers: { authorization: "Bearer t" }, cookies: { accessToken: "t" } })).toBe("next");
      expect(run({ method: "POST", path: "/api/x" })).toBe("next");
      expect(run({ method: "POST", path: "/api/billing/webhook", cookies: { accessToken: "t" } })).toBe("next");
    });
    it("allows cookie requests from an allowed origin or referer", () => {
      expect(run({ method: "POST", path: "/api/x", cookies: { accessToken: "t" }, headers: { origin: "https://app.example.com" } })).toBe("next");
      expect(run({ method: "POST", path: "/api/x", cookies: { refreshToken: "t" }, headers: { referer: "https://app.example.com/page" } })).toBe("next");
    });
    it("blocks cookie requests from other or missing origins", () => {
      expect(run({ method: "POST", path: "/api/x", cookies: { accessToken: "t" }, headers: { origin: "https://evil.example" } }).statusCode).toBe(403);
      expect(run({ method: "DELETE", path: "/api/x", cookies: { accessToken: "t" } }).statusCode).toBe(403);
    });
  });
});
