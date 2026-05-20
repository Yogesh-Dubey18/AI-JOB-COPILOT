import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { resetMemoryStore } from "../src/utils/memoryStore.js";
import { ensureSampleJobs } from "../src/services/job.service.js";

async function authAgent() {
  const agent = request.agent(app);
  await agent.post("/api/auth/register").send({ fullName: "Test User", email: "test@example.com", password: "Password123!" }).expect(201);
  return agent;
}

describe("AI Job Copilot API", () => {
  beforeEach(async () => {
    resetMemoryStore();
    await ensureSampleJobs();
  });

  it("registers a user", async () => {
    const res = await request(app).post("/api/auth/register").send({ fullName: "Asha Dev", email: "asha@example.com", password: "Password123!" }).expect(201);
    expect(res.body.data.user.email).toBe("asha@example.com");
  });

  it("logs in a user", async () => {
    await request(app).post("/api/auth/register").send({ fullName: "Asha Dev", email: "login@example.com", password: "Password123!" });
    const res = await request(app).post("/api/auth/login").send({ email: "login@example.com", password: "Password123!" }).expect(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it("protects auth middleware", async () => {
    await request(app).get("/api/auth/me").expect(401);
  });

  it("updates profile", async () => {
    const agent = await authAgent();
    const res = await agent.put("/api/profile").send({ headline: "React developer", skills: ["React", "Node.js"], targetRoles: ["React Developer"] }).expect(200);
    expect(res.body.data.profileCompletenessScore).toBeGreaterThan(0);
  });

  it("uploads resume and analyzes fallback", async () => {
    const agent = await authAgent();
    const upload = await agent.post("/api/resumes/upload").field("isBaseResume", "true").attach("resume", Buffer.from("Test User\ntest@example.com\nReact Node.js MongoDB\nAI Job Copilot project"), "resume.txt").expect(201);
    const analysis = await agent.post("/api/resumes/" + upload.body.data._id + "/analyze").send({ targetRole: "MERN Stack Developer" }).expect(201);
    expect(analysis.body.data.atsScore).toBeGreaterThan(0);
  });

  it("lists jobs and matches fallback", async () => {
    const agent = await authAgent();
    const upload = await agent.post("/api/resumes/upload").attach("resume", Buffer.from("React Node.js MongoDB"), "resume.txt");
    const jobs = await agent.get("/api/jobs").expect(200);
    const match = await agent.post("/api/jobs/" + jobs.body.data.items[0]._id + "/match").send({ resumeId: upload.body.data._id }).expect(201);
    expect(match.body.data.matchScore).toBeGreaterThan(0);
  });

  it("creates tailored resume fallback", async () => {
    const agent = await authAgent();
    const upload = await agent.post("/api/resumes/upload").attach("resume", Buffer.from("React Node.js MongoDB"), "resume.txt");
    const jobs = await agent.get("/api/jobs");
    const res = await agent.post("/api/jobs/" + jobs.body.data.items[0]._id + "/tailor-resume").send({ baseResumeId: upload.body.data._id }).expect(201);
    expect(res.body.data.afterAtsScore).toBeGreaterThan(res.body.data.beforeAtsScore);
  });

  it("creates application", async () => {
    const agent = await authAgent();
    const res = await agent.post("/api/applications").send({ company: "Test Co", role: "React Developer", status: "Applied" }).expect(201);
    expect(res.body.data.status).toBe("Applied");
  });

  it("generates interview prep fallback", async () => {
    const agent = await authAgent();
    const res = await agent.post("/api/ai/interview-prep").send({ role: "Full Stack Developer" }).expect(200);
    expect(res.body.data.technicalTopics.length).toBeGreaterThan(0);
  });
});
