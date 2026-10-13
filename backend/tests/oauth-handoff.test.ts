import { beforeEach, describe, expect, it } from "vitest";
import { createOAuthHandoff, exchangeOAuthHandoff, verifyOAuthState } from "../src/services/auth.service.js";
import { resetMemoryStore, memory } from "../src/utils/memoryStore.js";
import { createRecord, updateRecord } from "../src/utils/repository.js";
import request from "supertest";
import { app } from "../src/app.js";

describe("Google OAuth one-time handoff", () => {
  beforeEach(async () => resetMemoryStore());

  async function user() {
    return createRecord("users", {
      fullName: "OAuth Candidate",
      email: "oauth@example.com",
      passwordHash: "not-used",
      role: "job_seeker",
      isEmailVerified: true
    });
  }

  it("stores only a hash and exchanges a one-time opaque code for a session", async () => {
    const account = await user();
    const code = await createOAuthHandoff(String(account._id));
    expect(code).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(memory.oauthHandoffs).toHaveLength(1);
    expect(memory.oauthHandoffs[0].tokenHash).not.toBe(code);

    const session = await exchangeOAuthHandoff(code);
    expect(session.user.id).toBe(String(account._id));
    expect(session.accessToken).toBeTruthy();
    await expect(exchangeOAuthHandoff(code)).rejects.toThrow(/invalid or expired/i);
  });

  it("rejects malformed and expired handoffs", async () => {
    const account = await user();
    await expect(exchangeOAuthHandoff("not-a-handoff-code")).rejects.toThrow(/invalid or expired/i);
    const code = await createOAuthHandoff(String(account._id));
    const record = memory.oauthHandoffs[0];
    await updateRecord("oauthHandoffs", record._id, { expiresAt: new Date(Date.now() - 1000) });
    await expect(exchangeOAuthHandoff(code)).rejects.toThrow(/invalid or expired/i);
  });

  it("checks OAuth state against the HttpOnly cookie and exposes a one-time API exchange", async () => {
    const state = "a".repeat(64);
    expect(verifyOAuthState(state, state)).toBe(true);
    expect(verifyOAuthState(state, "b".repeat(64))).toBe(false);
    expect(verifyOAuthState("short", state)).toBe(false);

    const account = await user();
    const code = await createOAuthHandoff(String(account._id));
    const first = await request(app).post("/api/auth/google/exchange").send({ code }).expect(200);
    expect(first.body.data.user.id).toBe(String(account._id));
    expect(first.headers["cache-control"]).toBe("no-store");
    expect(first.headers["set-cookie"]).toBeDefined();
    await request(app).post("/api/auth/google/exchange").send({ code }).expect(400);
  });
});
