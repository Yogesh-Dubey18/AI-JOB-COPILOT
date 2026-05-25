import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { resetMemoryStore } from "../src/utils/memoryStore.js";
import { createRecord, updateRecord, findOneRecord } from "../src/utils/repository.js";
import { ensureSampleJobs } from "../src/services/job.service.js";
import { recordUsageEvent } from "../src/services/usage.service.js";

async function authAgent() {
  const agent = request.agent(app);
  await agent.post("/api/auth/register").send({ fullName: "Test User", email: "test@example.com", password: "Password123!" }).expect(201);
  return agent;
}

async function adminAgent() {
  const agent = request.agent(app);
  const register = await agent.post("/api/auth/register").send({ fullName: "Admin User", email: "admin@example.com", password: "Password123!" }).expect(201);
  await updateRecord("users", register.body.data.user.id, { role: "admin" });
  return agent;
}

describe("AI Job Copilot API", () => {
  beforeEach(async () => {
    resetMemoryStore();
    await ensureSampleJobs();
  });

  it("exposes safe health readiness and status endpoints with request ids", async () => {
    const health = await request(app).get("/health").expect(200);
    expect(health.headers["x-request-id"]).toBeTruthy();
    expect(health.body.data.status).toBe("ok");
    const ready = await request(app).get("/ready").expect(200);
    expect(ready.body.data.status).toBe("ready");
    expect(ready.body.data.providers.ai.provider).toBeTruthy();
    const status = await request(app).get("/status").set("x-request-id", "test-request-1").expect(200);
    expect(status.headers["x-request-id"]).toBe("test-request-1");
    expect(status.body.data.providers.monitoring.provider).toBe("noop");
  });

  it("registers a user", async () => {
    const res = await request(app).post("/api/auth/register").send({ fullName: "Asha Dev", email: "asha@example.com", password: "Password123!" }).expect(201);
    expect(res.body.data.user.email).toBe("asha@example.com");
  });

  it("rejects weak passwords", async () => {
    await request(app).post("/api/auth/register").send({ fullName: "Weak User", email: "weak@example.com", password: "password" }).expect(422);
  });

  it("logs in a user", async () => {
    await request(app).post("/api/auth/register").send({ fullName: "Asha Dev", email: "login@example.com", password: "Password123!" });
    const res = await request(app).post("/api/auth/login").send({ email: "login@example.com", password: "Password123!" }).expect(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it("temporarily locks accounts after repeated failed logins", async () => {
    await request(app).post("/api/auth/register").send({ fullName: "Lock User", email: "lock@example.com", password: "Password123!" }).expect(201);
    for (let i = 0; i < 5; i += 1) {
      await request(app).post("/api/auth/login").send({ email: "lock@example.com", password: "WrongPass123!" }).expect(401);
    }
    await request(app).post("/api/auth/login").send({ email: "lock@example.com", password: "Password123!" }).expect(423);
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
    const upload = await agent.post("/api/resumes/upload").field("isBaseResume", "true").field("anonymizePreview", "true").attach("resume", Buffer.from("Test User\ntest@example.com\n9876543210\nSkills React Node.js MongoDB\nProjects built AI Job Copilot project with REST API authentication"), "resume.txt").expect(201);
    expect(upload.body.data.parsedData.parserQuality).toBe("high");
    expect(upload.body.data.parsedData.redactedPreview.email).toBe("[redacted-email]");
    const edited = await agent.patch("/api/resumes/" + upload.body.data._id + "/parsed-data").send({ parsedData: { summary: "Updated MERN summary", skills: ["React", "Node.js", "MongoDB", "JWT"] } }).expect(200);
    expect(edited.body.data.parsedData.updatedByUser).toBe(true);
    const analysis = await agent.post("/api/resumes/" + upload.body.data._id + "/analyze").send({ targetRole: "MERN Stack Developer", jobDescription: "React Node.js MongoDB JWT Docker AWS REST API role", anonymizeForAnalysis: true }).expect(201);
    expect(analysis.body.data.atsScore).toBeGreaterThan(0);
    expect(analysis.body.data.keywordCoverage.coveragePercent).toBeGreaterThan(0);
    expect(analysis.body.data.jobDescriptionCoverage.coveragePercent).toBeGreaterThan(0);
    expect(analysis.body.data.privacyMode).toBe("anonymized_for_analysis");
    expect(analysis.body.data.atsBreakdown.total).toBeGreaterThan(0);
  });

  it("rejects fake PDF resume uploads with bad magic numbers", async () => {
    const agent = await authAgent();
    await agent.post("/api/resumes/upload")
      .attach("resume", Buffer.from("Not a real PDF file!"), "fake.pdf")
      .expect(400);
  });

  it("rejects executable file structures in uploads", async () => {
    const agent = await authAgent();
    const exeBuffer = Buffer.concat([Buffer.from("MZ"), Buffer.from("blah blah")]);
    await agent.post("/api/resumes/upload")
      .attach("resume", exeBuffer, "resume.pdf")
      .expect(400);
  });

  it("rejects oversized resume uploads", async () => {
    const agent = await authAgent();
    const largeBuffer = Buffer.alloc(5.1 * 1024 * 1024);
    await agent.post("/api/resumes/upload")
      .attach("resume", largeBuffer, "large.txt")
      .expect(400);
  });

  it("lists jobs and matches fallback", async () => {
    const agent = await authAgent();
    const upload = await agent.post("/api/resumes/upload").attach("resume", Buffer.from("React Node.js MongoDB"), "resume.txt");
    const jobs = await agent.get("/api/jobs").expect(200);
    const match = await agent.post("/api/jobs/" + jobs.body.data.items[0]._id + "/match").send({ resumeId: upload.body.data._id }).expect(201);
    expect(match.body.data.matchScore).toBeGreaterThan(0);
  });

  it("normalizes manual jobs and previews csv imports", async () => {
    const agent = await authAgent();
    const manual = await agent.post("/api/jobs/manual-import").send({
      title: "React Developer",
      company: "Manual Co",
      location: "Remote",
      skillsRequired: "React, TypeScript",
      applyUrl: "https://manual.example/jobs/react",
      description: "Build React features without any registration fee.",
      source: "Manual import"
    }).expect(201);
    expect(manual.body.data.duplicate).toBe(false);
    expect(manual.body.data.job.duplicateKey).toBeTruthy();
    expect(manual.body.data.job.riskFlags.length).toBeGreaterThan(0);
    const duplicate = await agent.post("/api/jobs/manual-import").send({
      title: "React Developer",
      company: "Manual Co",
      location: "Remote",
      applyUrl: "https://manual.example/jobs/react"
    }).expect(201);
    expect(duplicate.body.data.duplicate).toBe(true);
    const preview = await agent.post("/api/jobs/import/csv-preview").send({ csv: "title,company,location,applyUrl,skillsRequired\nNode Developer,CSV Co,Remote,https://csv.example/node,Node.js" }).expect(200);
    expect(preview.body.data[0].duplicateKey).toBeTruthy();
    const sources = await agent.get("/api/jobs/sources").expect(200);
    expect(sources.body.data.externalProviders.some((source: any) => source.id === "linkedin")).toBe(true);
    expect(sources.body.data.safetyRules.join(" ")).toMatch(/Do not scrape/i);
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
    expect(res.body.data.nextFollowUpDate).toBeTruthy();
    expect(res.body.data.priorityScore).toBeGreaterThan(0);
    const updated = await agent.patch("/api/applications/" + res.body.data._id + "/status").send({ status: "HR Call" }).expect(200);
    expect(updated.body.data.currentRound).toBe("HR Call");
    expect(updated.body.data.timeline.length).toBeGreaterThan(1);
    const insights = await agent.get("/api/applications/insights").expect(200);
    expect(insights.body.data.active).toBe(1);
  });

  it("returns advanced analytics and job-search intelligence", async () => {
    const agent = await authAgent();
    const me = await agent.get("/api/auth/me").expect(200);
    await agent.put("/api/profile").send({ headline: "Analytics developer", profileCompletenessScore: 85, skills: ["React", "Node.js"] }).expect(200);
    await agent.post("/api/applications").send({ company: "Analytics Co", role: "React Developer", status: "Applied", applicationSource: "Company careers" }).expect(201);
    await agent.post("/api/applications").send({ company: "Interview Co", role: "Node Developer", status: "HR Call", applicationSource: "Referral", nextFollowUpDate: new Date(Date.now() - 86400000).toISOString() }).expect(201);
    await createRecord("resumeAnalyses", { userId: me.body.data.id, atsScore: 78, missingKeywords: ["Docker", "Testing"] });
    await createRecord("jobMatches", { userId: me.body.data.id, missingSkills: ["Docker", "AWS"], matchScore: 72 });
    const overview = await agent.get("/api/analytics/overview").expect(200);
    expect(overview.body.data.jobSearchHealth.healthScore).toBeGreaterThanOrEqual(0);
    expect(overview.body.data.bestJobSources.length).toBeGreaterThan(0);
    const intelligence = await agent.get("/api/analytics/job-search-intelligence").expect(200);
    expect(intelligence.body.data.topMissingSkills[0].name).toBe("Docker");
    expect(intelligence.body.data.followUpsDue.length).toBeGreaterThan(0);
  });

  it("creates notification reminders and updates preferences", async () => {
    const agent = await authAgent();
    await agent.patch("/api/notifications/preferences").send({ email: true, applicationReminders: true }).expect(200);
    const preferences = await agent.get("/api/notifications/preferences").expect(200);
    expect(preferences.body.data.email).toBe(true);
    await agent.post("/api/applications").send({
      company: "Reminder Co",
      role: "Node Developer",
      status: "Applied",
      nextFollowUpDate: new Date(Date.now() - 86400000).toISOString()
    }).expect(201);
    const scan = await agent.post("/api/notifications/reminders/applications").send({}).expect(200);
    expect(scan.body.data.created).toBeGreaterThan(0);
    const notifications = await agent.get("/api/notifications").expect(200);
    expect(notifications.body.data.length).toBeGreaterThan(0);
  });

  it("collects feedback and lets admins triage issue drafts", async () => {
    const publicFeedback = await request(app).post("/api/feedback").send({
      type: "ux",
      contactEmail: "visitor@example.com",
      page: "/feedback",
      message: "The public feedback page should be usable before logging in."
    }).expect(201);
    expect(publicFeedback.body.data.userId).toBeUndefined();
    expect(publicFeedback.body.data.source).toBe("public_site");

    const agent = await authAgent();
    const created = await agent.post("/api/feedback").send({
      type: "bug",
      rating: 2,
      page: "/resume/analyzer",
      message: "The analyzer result was confusing after I uploaded a resume and should explain the next action."
    }).expect(201);
    expect(created.body.data.status).toBe("open");
    expect(created.body.data.issueTitle).toMatch(/BUG/i);
    const mine = await agent.get("/api/feedback/mine").expect(200);
    expect(mine.body.data.summary.total).toBe(1);

    const admin = await adminAgent();
    const inbox = await admin.get("/api/admin/feedback").expect(200);
    expect(inbox.body.data.summary.open).toBeGreaterThan(0);
    expect(inbox.body.data.issueQueue.length).toBeGreaterThan(0);
    const draft = await admin.post("/api/admin/feedback/" + created.body.data._id + "/issue-draft").send({}).expect(200);
    expect(draft.body.data.body).toMatch(/Triage Checklist/);
    const updated = await admin.patch("/api/admin/feedback/" + created.body.data._id).send({ status: "in_review", priority: "high", releaseTarget: "v2.1" }).expect(200);
    expect(updated.body.data.status).toBe("in_review");
    expect(updated.body.data.priority).toBe("high");
  });

  it("exports privacy data, updates preferences, sanitizes admin users, and requires confirmed deletion", async () => {
    const agent = await authAgent();
    await agent.put("/api/profile").send({ headline: "Privacy-aware developer", skills: ["React"], targetRoles: ["Frontend Developer"] }).expect(200);
    const preferences = await agent.patch("/api/privacy/preferences").send({ shareProductAnalytics: true, personalizationEnabled: false }).expect(200);
    expect(preferences.body.data.shareProductAnalytics).toBe(true);
    expect(preferences.body.data.allowAiTraining).toBe(false);
    const exported = await agent.get("/api/privacy/export").expect(200);
    expect(exported.body.data.user.email).toBe("test@example.com");
    expect(exported.body.data.user.passwordHash).toBeUndefined();
    expect(exported.body.data.data.profiles.length).toBe(1);
    await agent.delete("/api/privacy/account").send({ confirmation: "delete" }).expect(422);
    const admin = await adminAgent();
    const users = await admin.get("/api/admin/users").expect(200);
    expect(users.body.data[0].passwordHash).toBeUndefined();
    await agent.delete("/api/privacy/account").send({ confirmation: "DELETE MY ACCOUNT" }).expect(200);
    await agent.get("/api/auth/me").expect(401);
  });

  it("generates interview prep fallback", async () => {
    const agent = await authAgent();
    const res = await agent.post("/api/ai/interview-prep").send({ role: "Full Stack Developer" }).expect(200);
    expect(res.body.data.technicalTopics.length).toBeGreaterThan(0);
  });

  it("runs interview coach sessions and readiness endpoints", async () => {
    const agent = await authAgent();
    const session = await agent.post("/api/interviews/sessions/start").send({ role: "Full Stack Developer", focus: "project" }).expect(201);
    expect(session.body.data.currentQuestion).toMatch(/project/i);
    const answer = await agent.post("/api/interviews/sessions/answer").send({ sessionId: session.body.data._id, answer: "I built a job tracker with React, Node.js, Express, MongoDB, auth, and dashboards." }).expect(200);
    expect(answer.body.data.scoreHistory.length).toBeGreaterThan(0);
    const readiness = await agent.get("/api/interviews/readiness").expect(200);
    expect(readiness.body.data.readinessScore).toBeGreaterThanOrEqual(0);
    const bank = await agent.get("/api/interviews/question-bank/Full%20Stack%20Developer").expect(200);
    expect(bank.body.data.project.length).toBeGreaterThan(0);
    const history = await agent.get("/api/interviews/history").expect(200);
    expect(history.body.data.sessions.length).toBeGreaterThan(0);
    const dsa = await agent.get("/api/interviews/dsa-tracker").expect(200);
    expect(dsa.body.data.questions.length).toBeGreaterThan(0);
  });

  it("generates public portfolios with privacy controls", async () => {
    const agent = await authAgent();
    const created = await agent.post("/api/portfolios/generate").send({
      slug: "privacy-portfolio",
      displayName: "Privacy Dev",
      headline: "Full-stack developer",
      contactEmail: "private@example.com",
      resumeUrl: "https://example.com/resume.pdf",
      isPublished: true,
      sections: { showEmail: false, showResume: false, showProjects: true, showSkills: true, showLinks: true },
      message: "React Node MongoDB project portfolio"
    }).expect(201);
    expect(created.body.data.publicProfile.slug).toBe("privacy-portfolio");
    const list = await agent.get("/api/portfolios").expect(200);
    expect(list.body.data.length).toBe(1);
    const publicProfile = await request(app).get("/api/portfolios/public/privacy-portfolio").expect(200);
    expect(publicProfile.body.data.contactEmail).toBe("");
    expect(publicProfile.body.data.resumeUrl).toBe("");
    const updated = await agent.patch("/api/portfolios/" + created.body.data._id).send({
      contactEmail: "public@example.com",
      sections: { showEmail: true }
    }).expect(200);
    expect(updated.body.data.publicProfile.contactEmail).toBe("public@example.com");
    const visible = await request(app).get("/api/portfolios/public/privacy-portfolio").expect(200);
    expect(visible.body.data.contactEmail).toBe("public@example.com");
  });

  it("generates PDF exports and keeps export history user-scoped", async () => {
    const agent = await authAgent();
    const upload = await agent.post("/api/resumes/upload").attach("resume", Buffer.from("Test User\nSkills React Node.js MongoDB\nProjects AI Job Copilot"), "resume.txt").expect(201);
    const resumeExport = await agent.post("/api/exports/resume/" + upload.body.data._id).send({}).expect(201);
    expect(resumeExport.body.data.fileUrl).toMatch(/\.pdf$/);
    await agent.get(resumeExport.body.data.fileUrl).expect(200);

    const jobs = await agent.get("/api/jobs").expect(200);
    const tailored = await agent.post("/api/jobs/" + jobs.body.data.items[0]._id + "/tailor-resume").send({ baseResumeId: upload.body.data._id }).expect(201);
    const tailoredExport = await agent.post("/api/exports/tailored-resume/" + tailored.body.data._id).send({}).expect(201);
    expect(tailoredExport.body.data.sourceType).toBe("tailored-resume");

    const kit = await agent.post("/api/ai/generate-application-kit").send({ jobId: jobs.body.data.items[0]._id, resumeVersionId: tailored.body.data.resumeVersionId }).expect(200);
    const kitExport = await agent.post("/api/exports/application-kit/" + kit.body.data._id).send({}).expect(201);
    expect(kitExport.body.data.sourceType).toBe("application-kit");

    const portfolio = await agent.post("/api/portfolios/generate").send({ slug: "export-portfolio", message: "React Node MongoDB portfolio", sections: { showEmail: false, showResume: false } }).expect(201);
    const portfolioExport = await agent.post("/api/exports/portfolio/" + portfolio.body.data._id).send({}).expect(201);
    expect(portfolioExport.body.data.privacy.notes.join(" ")).toMatch(/visibility settings/i);

    const interview = await agent.post("/api/interviews").send({ roundType: "Technical", roundNumber: 1, mode: "Video", topicsExpected: ["React", "Node.js"], nextSteps: ["Revise projects"] }).expect(201);
    const prepExport = await agent.post("/api/exports/interview-prep/" + interview.body.data._id).send({}).expect(201);
    expect(prepExport.body.data.sourceType).toBe("interview-prep");

    const legacyResumeExport = await agent.post("/api/resumes/" + upload.body.data._id + "/export-pdf").send({}).expect(201);
    expect(legacyResumeExport.body.data.renderer).toBe("native-basic-pdf");

    const history = await agent.get("/api/exports/history").expect(200);
    expect(history.body.data.length).toBeGreaterThanOrEqual(6);
  });

  it("reports ai status and tracks guarded usage", async () => {
    const agent = await authAgent();
    const redactionSample = "sk-" + "testsecretvalueforredaction";
    const status = await agent.get("/api/ai/status").expect(200);
    expect(status.body.data.fallbackEnabled).toBe(true);
    expect(status.body.data.schemaValidation).toBe("enabled");
    await agent.post("/api/ai/chat").send({
      message: `Create a truthful 7-day job search plan. Do not send anything automatically. Redact ${redactionSample}.`
    }).expect(200);
    const usage = await agent.get("/api/ai/usage").expect(200);
    expect(usage.body.data.totalEvents).toBeGreaterThan(0);
    expect(usage.body.data.events[0].safetyFlags).toContain("openai_key_redacted");
  });

  it("returns billing plans and activates mock subscriptions", async () => {
    const agent = await authAgent();
    const plans = await agent.get("/api/billing/plans").expect(200);
    expect(plans.body.data.plans.length).toBeGreaterThan(0);
    const checkout = await agent.post("/api/billing/checkout").send({ planId: "pro" }).expect(200);
    expect(checkout.body.data.provider).toBe("mock");
    const activated = await agent.post("/api/billing/mock/activate").send({ planId: "pro" }).expect(200);
    expect(activated.body.data.currentPlan.id).toBe("pro");
    const summary = await agent.get("/api/billing/summary").expect(200);
    expect(summary.body.data.currentPlan.id).toBe("pro");
  });

  it("protects and exposes admin operations endpoints", async () => {
    const user = await authAgent();
    await user.get("/api/admin/system-health").expect(403);
    const admin = await adminAgent();
    const health = await admin.get("/api/admin/system-health").expect(200);
    expect(health.body.data.status).toBe("ok");
    const monitoring = await admin.get("/api/admin/monitoring").expect(200);
    expect(monitoring.body.data.providers.monitoring.provider).toBe("noop");
    const risks = await admin.get("/api/admin/risk-signals").expect(200);
    expect(Array.isArray(risks.body.data.signals)).toBe(true);
    const usage = await admin.get("/api/admin/usage-analytics").expect(200);
    expect(usage.body.data.totals).toBeTruthy();
    const logs = await admin.get("/api/admin/audit-logs").expect(200);
    expect(Array.isArray(logs.body.data)).toBe(true);
  });

  it("enforces ai usage limits", async () => {
    const agent = await authAgent();
    const me = await agent.get("/api/auth/me").expect(200);
    for (let i = 0; i < 50; i += 1) {
      await recordUsageEvent(me.body.data.id, "test-fill", 1, "test");
    }
    const limited = await agent.post("/api/ai/chat").send({ message: "Will this run?" }).expect(402);
    expect(limited.body.message).toMatch(/credit limit/i);
  });

  it("rejects oversized ai payloads", async () => {
    const agent = await authAgent();
    await agent.post("/api/ai/chat").send({ message: "x".repeat(30_000) }).expect(422);
  });

  it("exposes provider status and handles Google OAuth redirect checks when unconfigured", async () => {
    const statusRes = await request(app).get("/api/auth/providers/status").expect(200);
    expect(statusRes.body.success).toBe(true);
    expect(statusRes.body.data.google.configured).toBe(false);
    expect(statusRes.body.data.google.status).toBe("ready");

    const googleRes = await request(app).get("/api/auth/google").expect(400);
    expect(googleRes.body.success).toBe(false);
    expect(googleRes.body.message).toMatch(/credentials not configured/i);

    const callbackRes = await request(app).get("/api/auth/google/callback?code=mockcode").expect(400);
    expect(callbackRes.body.success).toBe(false);
  });

  it("saves, lists, and deletes company research records", async () => {
    const agent = await authAgent();
    // 1. Initially empty
    const list1 = await agent.get("/api/company-research").expect(200);
    expect(list1.body.data).toEqual([]);

    // 2. Save a company research record
    const saveRes = await agent.post("/api/company-research").send({
      companyName: "Google",
      industry: "Technology",
      techStack: ["React", "TypeScript", "Node.js", "Go"],
      culture: "Engineering-driven",
      glassdoorRating: 4.5,
      salaryRangeMin: 120000,
      salaryRangeMax: 200000,
      careerPageUrl: "https://careers.google.com",
      interviewProcess: "Resume screen, technical phone screen, onsite rounds",
      notes: "Google is my dream target company."
    }).expect(201);
    expect(saveRes.body.data.companyName).toBe("Google");
    expect(saveRes.body.data.techStack).toContain("TypeScript");

    // 3. List contains the saved record
    const list2 = await agent.get("/api/company-research").expect(200);
    expect(list2.body.data.length).toBe(1);
    expect(list2.body.data[0].companyName).toBe("Google");

    // 4. Delete the record
    await agent.delete(`/api/company-research/${saveRes.body.data._id}`).expect(200);

    // 5. Empty again
    const list3 = await agent.get("/api/company-research").expect(200);
    expect(list3.body.data).toEqual([]);
  });

  it("saves, lists, and deletes answer vault records", async () => {
    const agent = await authAgent();
    // 1. Initially empty
    const list1 = await agent.get("/api/answer-vault").expect(200);
    expect(list1.body.data).toEqual([]);

    // 2. Save an answer vault record
    const saveRes = await agent.post("/api/answer-vault").send({
      question: "Tell me about a time you resolved a conflict on your team.",
      answer: "I used the STAR method to describe how I sat down with the other engineer, listened to their perspective, and proposed a compromised architecture that satisfied both requirements.",
      category: "Behavioral",
      tags: ["conflict", "teamwork"]
    }).expect(201);
    expect(saveRes.body.data.question).toBe("Tell me about a time you resolved a conflict on your team.");
    expect(saveRes.body.data.tags).toContain("conflict");

    // 3. List contains the saved record
    const list2 = await agent.get("/api/answer-vault").expect(200);
    expect(list2.body.data.length).toBe(1);
    expect(list2.body.data[0].question).toBe("Tell me about a time you resolved a conflict on your team.");

    // 4. Delete the record
    await agent.delete(`/api/answer-vault/${saveRes.body.data._id}`).expect(200);

    // 5. Empty again
    const list3 = await agent.get("/api/answer-vault").expect(200);
    expect(list3.body.data).toEqual([]);
  });

  it("saves, lists, and deletes career vault records", async () => {
    const agent = await authAgent();
    // 1. Initially empty
    const list1 = await agent.get("/api/career-vault").expect(200);
    expect(list1.body.data).toEqual([]);

    // 2. Save a career vault record
    const saveRes = await agent.post("/api/career-vault").send({
      type: "experience",
      title: "Senior Software Engineer",
      organisation: "Acme Corp",
      startDate: "2023-01",
      endDate: "2026-05",
      description: "Led development of core features.",
      impact: "Reduced page load time by 40%.",
      skills: ["React", "TypeScript", "Node.js"]
    }).expect(201);
    expect(saveRes.body.data.title).toBe("Senior Software Engineer");
    expect(saveRes.body.data.skills).toContain("TypeScript");

    // 3. List contains the saved record
    const list2 = await agent.get("/api/career-vault").expect(200);
    expect(list2.body.data.length).toBe(1);
    expect(list2.body.data[0].title).toBe("Senior Software Engineer");

    // 4. Delete the record
    await agent.delete(`/api/career-vault/${saveRes.body.data._id}`).expect(200);

    // 5. Empty again
    const list3 = await agent.get("/api/career-vault").expect(200);
    expect(list3.body.data).toEqual([]);
  });

  it("handles forgot-password and reset-password flow safely and securely", async () => {
    // 1. Register a test user
    const email = "recovery@example.com";
    await request(app).post("/api/auth/register").send({
      fullName: "Recovery User",
      email,
      password: "Password123!"
    }).expect(201);

    // 2. Request password reset (existing email)
    const resExist = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email })
      .expect(200);

    // Verify response structure and generic messaging
    expect(resExist.body.data.message).toContain("If an account exists");
    // Development mode should return the token (since test runs under development/test and mock mode)
    const token = resExist.body.data.token;
    expect(token).toBeTruthy();

    // 3. Request password reset (non-existing email)
    const resNotExist = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nonexistent@example.com" })
      .expect(200);

    expect(resNotExist.body.data.message).toContain("If an account exists");
    // Verify it returns the token in dev mode even for non-existent emails to prevent enumeration leaks!
    expect(resNotExist.body.data.token).toBeTruthy();
    expect(resNotExist.body.data.token).not.toBe(token);

    // 4. Verify token hash storage in the DB (directly search DB record)
    const userInDb = await findOneRecord("users", { email });
    expect(userInDb).toBeTruthy();
    expect(userInDb.passwordResetTokenHash).toBeTruthy();
    // It must NOT store the raw token in the database
    expect(userInDb.passwordResetTokenHash).not.toBe(token);
    expect(userInDb.passwordResetExpires).toBeTruthy();

    // 5. Attempt reset with invalid token
    const resInvalid = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "invalidtoken123", password: "NewPassword123!" })
      .expect(400);
    expect(resInvalid.body.message).toContain("invalid or has expired");

    // 6. Attempt reset with weak password
    await request(app)
      .post("/api/auth/reset-password")
      .send({ token, password: "weak" })
      .expect(422);

    // 7. Manually expire token in DB and attempt reset
    await updateRecord("users", userInDb._id.toString(), {
      passwordResetExpires: new Date(Date.now() - 1000) // Expired
    });
    const resExpired = await request(app)
      .post("/api/auth/reset-password")
      .send({ token, password: "NewPassword123!" })
      .expect(400);
    expect(resExpired.body.message).toContain("invalid or has expired");

    // Restore valid expiration for the next steps
    await updateRecord("users", userInDb._id.toString(), {
      passwordResetExpires: new Date(Date.now() + 60000) // Valid for 1 min
    });

    // 8. Attempt successful password reset
    const resSuccess = await request(app)
      .post("/api/auth/reset-password")
      .send({ token, password: "NewPassword123!" })
      .expect(200);
    expect(resSuccess.body.data.reset).toBe(true);
    expect(resSuccess.body.data.message).toContain("successfully reset");

    // Verify token was invalidated
    const updatedUser = await findOneRecord("users", { email });
    expect(updatedUser.passwordResetTokenHash).toBeNull();
    expect(updatedUser.passwordResetExpires).toBeNull();

    // 9. Login with new password
    await request(app)
      .post("/api/auth/login")
      .send({ email, password: "NewPassword123!" })
      .expect(200);

    // Old password should fail
    await request(app)
      .post("/api/auth/login")
      .send({ email, password: "Password123!" })
      .expect(401);
  });
});
