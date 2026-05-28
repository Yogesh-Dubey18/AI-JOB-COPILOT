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

  it("scores a resume draft without writing to the database", async () => {
    const agent = await authAgent();
    const draftPayload = {
      parsedData: {
        name: "Test User",
        email: "test@example.com",
        phone: "9876543210",
        links: ["linkedin.com/in/test", "github.com/test"],
        summary: "Experiened React and Node.js full stack developer with 3 years of experience.",
        skills: ["React", "TypeScript", "Node.js", "Express", "MongoDB", "Git"],
        projects: [
          {
            name: "Portfolio Project",
            technologies: "React, Node.js",
            bullets: ["Built a responsive full stack platform using React and Node.js which improved page speed by 40%."]
          }
        ],
        experience: [
          {
            company: "Tech Corp",
            role: "Software Engineer",
            bullets: ["Developed REST APIs and integrated Stripe payments reducing checkout friction."]
          }
        ],
        education: [
          {
            institution: "University of Tech",
            degree: "B.S.",
            field: "Computer Science"
          }
        ]
      },
      targetRole: "Full Stack Developer",
      jobDescription: "Looking for a React developer with TypeScript, Node.js, Express, MongoDB, and Git experience."
    };

    const res = await agent.post("/api/resumes/score-draft")
      .send(draftPayload)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.atsScore).toBeGreaterThan(50);
    expect(res.body.data.categoryScores).toBeDefined();
    expect(res.body.data.categoryScores.content.score).toBeGreaterThan(0);
    expect(res.body.data.jobDescriptionCoverage.coveragePercent).toBeGreaterThan(0);
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
    // Save original env vars
    const originalGoogleId = process.env.GOOGLE_CLIENT_ID;
    const originalGoogleSecret = process.env.GOOGLE_CLIENT_SECRET;

    try {
      // Test when keys are absent
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;

      const statusRes1 = await request(app).get("/api/auth/providers/status").expect(200);
      expect(statusRes1.body.success).toBe(true);
      expect(statusRes1.body.data.google.configured).toBe(false);
      expect(statusRes1.body.data.google.status).toBe("not_configured");

      // Test when keys exist but are empty (placeholders)
      process.env.GOOGLE_CLIENT_ID = "";
      process.env.GOOGLE_CLIENT_SECRET = "";

      const statusRes2 = await request(app).get("/api/auth/providers/status").expect(200);
      expect(statusRes2.body.success).toBe(true);
      expect(statusRes2.body.data.google.configured).toBe(false);
      expect(statusRes2.body.data.google.status).toBe("ready");

      const googleRes = await request(app).get("/api/auth/google").expect(302);
      expect(googleRes.headers.location).toMatch(/\/login\?error=Google%20OAuth%20credentials%20not%20configured/i);

      const callbackRes = await request(app).get("/api/auth/google/callback?code=mockcode").expect(302);
      expect(callbackRes.headers.location).toMatch(/\/login\?error=Google%20OAuth%20credentials%20not%20configured/i);
    } finally {
      // Restore original env vars
      if (typeof originalGoogleId !== "undefined") {
        process.env.GOOGLE_CLIENT_ID = originalGoogleId;
      } else {
        delete process.env.GOOGLE_CLIENT_ID;
      }
      if (typeof originalGoogleSecret !== "undefined") {
        process.env.GOOGLE_CLIENT_SECRET = originalGoogleSecret;
      } else {
        delete process.env.GOOGLE_CLIENT_SECRET;
      }
    }
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

  it("parses job text heuristics and AI fallbacks", async () => {
    const agent = await authAgent();
    
    // Test parsing a URL
    const parseUrlRes = await agent
      .post("/api/jobs/parse-text")
      .send({ text: "https://jobs.lever.co/google/software-engineer-react-1234" })
      .expect(200);
    expect(parseUrlRes.body.data.title).toContain("Software Engineer React");
    expect(parseUrlRes.body.data.company).toBe("Google");
    expect(parseUrlRes.body.data.remoteType).toBe("Remote");

    // Test parsing raw text
    const parseTextRes = await agent
      .post("/api/jobs/parse-text")
      .send({ text: "Job Title: React Frontend Developer\nCompany: PixelCraft\nLocation: Bengaluru\nResponsibilities:\n- Build cool stuff\nRequirements:\n- React and Node.js knowledge" })
      .expect(200);
    expect(parseTextRes.body.data.title).toBe("React Frontend Developer");
    expect(parseTextRes.body.data.company).toBe("PixelCraft");
    expect(parseTextRes.body.data.location).toBe("Bengaluru");
    expect(parseTextRes.body.data.skillsRequired).toContain("React");
    expect(parseTextRes.body.data.skillsRequired).toContain("Node.js");
  });

  it("handles manual job import and duplicate detection", async () => {
    const agent = await authAgent();
    
    const jobData = {
      title: "Vue Developer",
      company: "PixelCraft Labs",
      location: "Bengaluru",
      remoteType: "Hybrid",
      jobType: "Full-time",
      skillsRequired: ["Vue", "TypeScript"],
      description: "Awesome Vue developer role",
      source: "Manual import"
    };

    // First import (should succeed and not be marked as duplicate)
    const importRes = await agent
      .post("/api/jobs/manual-import")
      .send(jobData)
      .expect(201);
    expect(importRes.body.data.duplicate).toBe(false);
    expect(importRes.body.data.job.title).toBe("Vue Developer");

    // Second import with same details (should detect duplicate)
    const importDupRes = await agent
      .post("/api/jobs/manual-import")
      .send(jobData)
      .expect(201);
    expect(importDupRes.body.data.duplicate).toBe(true);
    expect(importDupRes.body.data.job._id).toBe(importRes.body.data.job._id);
  });

  it("calculates job match applyReadinessScore correctly", async () => {
    const agent = await authAgent();
    
    // Create a mock resume first
    const resume = await createRecord("resumes", {
      userId: "test-user-id",
      fileName: "resume.pdf",
      rawText: "React Node.js developer with TypeScript",
      parsedData: {
        skills: ["React", "Node.js", "TypeScript"],
        summary: "Full stack developer",
        projects: ["Built a portfolio site"],
        experience: ["Worked at tech company"],
        education: ["BS Computer Science"]
      }
    });

    const user = await findOneRecord("users", { email: "test@example.com" });
    await updateRecord("resumes", resume._id, { userId: user._id });

    // Create a job match
    const jobsRes = await agent.get("/api/jobs").expect(200);
    const jobId = jobsRes.body.data.items[0]._id;

    const matchRes = await agent
      .post(`/api/jobs/${jobId}/match`)
      .send({ resumeId: resume._id })
      .expect(201);

    expect(matchRes.body.data.matchScore).toBeDefined();
    expect(matchRes.body.data.applyReadinessScore).toBeDefined();
    expect(matchRes.body.data.applyReadinessScore).toBeGreaterThanOrEqual(0);
    expect(matchRes.body.data.applyReadinessScore).toBeLessThanOrEqual(100);
  });

  it("reports provider status honestly", async () => {
    const res = await request(app).get("/api/jobs/sources").expect(200);
    expect(res.body.success).toBe(true);
    const providers = res.body.data.externalProviders;
    expect(providers).toBeDefined();
    providers.forEach((p: any) => {
      expect(p.status).toMatch(/live|ready|not_configured/);
      expect(p.isLive).toBeDefined();
    });
  });

  it("handles recruiter contacts and linking to applications", async () => {
    const agent = await authAgent();

    // 1. Create a contact
    const contactRes = await agent
      .post("/api/contacts")
      .send({
        name: "Jane Doe",
        company: "PixelCraft Labs",
        role: "Technical Recruiter",
        email: "jane@pixelcraft.com",
        phone: "+1-555-0199",
        linkedinUrl: "https://linkedin.com/in/janedoe",
        notes: "Met at career fair"
      })
      .expect(201);
    expect(contactRes.body.success).toBe(true);
    expect(contactRes.body.data.name).toBe("Jane Doe");
    const contactId = contactRes.body.data._id;

    // 2. List contacts
    const listRes = await agent.get("/api/contacts").expect(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.some((c: any) => c._id === contactId)).toBe(true);

    // 3. Create application with contactId linked
    const appRes = await agent
      .post("/api/applications")
      .send({
        company: "PixelCraft Labs",
        role: "Vue Developer",
        contactId
      })
      .expect(201);
    expect(appRes.body.success).toBe(true);
    expect(appRes.body.data.contactId).toBe(contactId);
    expect(appRes.body.data.contact).toBeDefined();
    expect(appRes.body.data.contact.name).toBe("Jane Doe");

    // 4. Update application's contactId
    const appRes2 = await agent
      .patch(`/api/applications/${appRes.body.data._id}`)
      .send({
        contactId: null
      })
      .expect(200);
    expect(appRes2.body.data.contact).toBeUndefined();

    // 5. Delete contact
    await agent.delete(`/api/contacts/${contactId}`).expect(200);
    const listResAfter = await agent.get("/api/contacts").expect(200);
    expect(listResAfter.body.data.some((c: any) => c._id === contactId)).toBe(false);
  });

  it("generates application kits with different tones and labels fallback honestly", async () => {
    const agent = await authAgent();

    // Create a resume version and job directly (bypass HTTP upload requirement)
    const user = await findOneRecord("users", { email: "test@example.com" });
    const resumeVer = await createRecord("resumeVersions", {
      userId: user!._id,
      title: "React Developer Version",
      content: { skills: ["React", "TypeScript"] }
    });
    const jobRes = await agent.get("/api/jobs").expect(200);
    const job = jobRes.body.data.items[0];

    // Generate Kit with Professional Tone
    const kitResProf = await agent
      .post("/api/ai/generate-application-kit")
      .send({
        jobId: job._id,
        resumeVersionId: resumeVer._id,
        tone: "Professional"
      })
      .expect(200);
    expect(kitResProf.body.success).toBe(true);
    expect(kitResProf.body.data.isFallback).toBe(true); // Should be fallback in test env (mock provider)
    expect(kitResProf.body.data.disclaimer).toMatch(/Manual review required/i);
    expect(kitResProf.body.data.whyHireYouAnswer).toContain("clean code, reliability");

    // Generate Kit with Fresher-friendly Tone
    const kitResFresher = await agent
      .post("/api/ai/generate-application-kit")
      .send({
        jobId: job._id,
        resumeVersionId: resumeVer._id,
        tone: "Fresher-friendly"
      })
      .expect(200);
    expect(kitResFresher.body.success).toBe(true);
    // Tones should produce different text
    expect(kitResProf.body.data.whyHireYouAnswer).not.toEqual(kitResFresher.body.data.whyHireYouAnswer);
    expect(kitResFresher.body.data.whyHireYouAnswer).toContain("enthusiastic graduate");
    
    // Assert all 10 custom answers and fields are present
    const data = kitResProf.body.data;
    expect(data.whyHireYouAnswer).toBeDefined();
    expect(data.whyCompanyAnswer).toBeDefined();
    expect(data.tellMeAboutYourselfAnswer).toBeDefined();
    expect(data.salaryAnswer).toBeDefined();
    expect(data.noticePeriodAnswer).toBeDefined();
    expect(data.workAuthorizationAnswer).toBeDefined();
    expect(data.assignmentSubmissionAnswer).toBeDefined();
    expect(data.followUpMessageAnswer).toBeDefined();
    expect(data.rejectionResponseAnswer).toBeDefined();
    expect(data.interviewConfirmationAnswer).toBeDefined();
    expect(data.coverLetter).toBeDefined();
    expect(data.hrEmail).toBeDefined();
    expect(data.linkedinMessage).toBeDefined();
    expect(data.whatsappMessage).toBeDefined();
    expect(data.referralMessage).toBeDefined();
    expect(data.interviewPrepPlan).toBeDefined();
  });

  it("returns all 10 interview prep modes", async () => {
    const agent = await authAgent();
    const res = await agent.get("/api/interviews/prep/modes").expect(200);
    expect(res.body.success).toBe(true);
    const modes = res.body.data;
    expect(Array.isArray(modes)).toBe(true);
    expect(modes.length).toBe(10);
    const ids = modes.map((m: any) => m.id);
    expect(ids).toContain("hr");
    expect(ids).toContain("technical");
    expect(ids).toContain("react");
    expect(ids).toContain("node");
    expect(ids).toContain("mern");
    expect(ids).toContain("javascript");
    expect(ids).toContain("project");
    expect(ids).toContain("fresher");
    expect(ids).toContain("salary");
    expect(ids).toContain("assignment");
  });

  it("returns fallback question bank for each prep mode", async () => {
    const agent = await authAgent();
    for (const mode of ["hr", "react", "salary", "fresher"]) {
      const res = await agent.get(`/api/interviews/prep/question-bank/${mode}`).expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isFallback).toBe(true);
      expect(res.body.data.questions.length).toBeGreaterThan(0);
      expect(res.body.data.questions[0].question).toBeTruthy();
      expect(res.body.data.questions[0].hint).toBeTruthy();
      expect(res.body.data.label).toMatch(/Fallback Template Mode/i);
    }
  });

  it("validates STAR template generation requires mode and question", async () => {
    const agent = await authAgent();
    // Missing both fields
    const bad = await agent.post("/api/interviews/prep/star-template").send({}).expect(400);
    expect(bad.body.success).toBe(false);
    // Valid request
    const good = await agent
      .post("/api/interviews/prep/star-template")
      .send({ mode: "project", question: "Walk me through your most complex project." })
      .expect(200);
    expect(good.body.success).toBe(true);
    expect(good.body.data.situation).toBeTruthy();
    expect(good.body.data.task).toBeTruthy();
    expect(good.body.data.action).toBeTruthy();
    expect(good.body.data.result).toBeTruthy();
    expect(good.body.data.polishedAnswer).toBeTruthy();
    expect(good.body.data.isFallback).toBe(true);
  });

  it("saves STAR answer to Answer Vault via prep endpoint", async () => {
    const agent = await authAgent();
    // Missing fields should 400
    const bad = await agent.post("/api/interviews/prep/save-to-vault").send({ question: "Tell me about yourself." }).expect(400);
    expect(bad.body.success).toBe(false);
    // Valid save
    const good = await agent.post("/api/interviews/prep/save-to-vault").send({
      question: "Tell me about yourself.",
      answer: "I am a MERN stack developer with 3 years of experience...",
      mode: "hr"
    }).expect(201);
    expect(good.body.success).toBe(true);
    expect(good.body.data.category).toMatch(/Interview Prep/i);
    // Verify it appears in vault listing
    const list = await agent.get("/api/answer-vault").expect(200);
    expect(list.body.data.some((v: any) => v.question === "Tell me about yourself.")).toBe(true);
  });

  it("returns advanced interview readiness heuristic score", async () => {
    const agent = await authAgent();
    const res = await agent.get("/api/interviews/prep/readiness").expect(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.readinessScore).toBe("number");
    expect(res.body.data.readinessScore).toBeGreaterThanOrEqual(0);
    expect(res.body.data.readinessScore).toBeLessThanOrEqual(100);
    expect(res.body.data.scores).toBeTruthy();
    expect(res.body.data.disclaimer).toMatch(/heuristic/i);
    expect(res.body.data.voiceNote).toMatch(/provider-ready/i);
  });

  it("returns interview prep context with empty state when no job selected", async () => {
    const agent = await authAgent();
    const res = await agent.get("/api/interviews/prep/context").expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hasContext).toBe(false);
    expect(res.body.data.message).toBeTruthy();
  });

  it("calculates skill gap, lists learning plans, and updates plan progress", async () => {
    const agent = await authAgent();
    const generateRes = await agent.post("/api/ai/skill-gap").send({
      targetRole: "Senior React Developer",
      currentSkills: ["React", "JavaScript", "CSS"],
      message: "Analyze gap"
    }).expect(200);

    expect(generateRes.body.success).toBe(true);
    expect(generateRes.body.data.targetRole).toBe("Senior React Developer");
    expect(generateRes.body.data.missingSkills).toContain("Docker");
    expect(generateRes.body.data.sevenDayPlan).toBeInstanceOf(Array);
    expect(generateRes.body.data.thirtyDayPlan).toBeInstanceOf(Array);
    expect(generateRes.body.data.fallbackResources).toBeInstanceOf(Array);
    expect(generateRes.body.data.progress).toBe(0);

    const planId = generateRes.body.data._id;

    const listRes = await agent.get("/api/ai/skill-gap/plans").expect(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.length).toBeGreaterThan(0);
    expect(listRes.body.data[0]._id).toBe(planId);

    const patchRes = await agent.patch("/api/ai/skill-gap/plans/" + planId).send({
      progress: 45
    }).expect(200);
    expect(patchRes.body.success).toBe(true);
    expect(patchRes.body.data.progress).toBe(45);
  });

  it("handles portfolio generator, slug validation, duplicate rejection, and privacy visibility controls", async () => {
    const agent = await authAgent();

    // 1. Generate portfolio with valid slug
    const genRes = await agent.post("/api/portfolios/generate").send({
      slug: "jane-designer",
      title: "Jane Developer Portfolio",
      displayName: "Jane Developer",
      headline: "React Developer",
      contactEmail: "jane@example.com",
      contactPhone: "+1-555-9876",
      githubUrl: "https://github.com/jane",
      linkedinUrl: "https://linkedin.com/jane",
      theme: "bold",
      isPublished: true,
      sections: {
        showEmail: true,
        showPhone: true,
        showResume: false,
        showProjects: true,
        showSkills: true,
        showLinks: true,
        showRoadmap: true
      }
    }).expect(201);
    expect(genRes.body.success).toBe(true);
    expect(genRes.body.data.slug).toBe("jane-designer");
    expect(genRes.body.data.title).toBe("Jane Developer Portfolio");
    expect(genRes.body.data.isPublished).toBe(true);
    const portfolioId = genRes.body.data._id;

    const slugCheck = await agent.get("/api/portfolios/slug/jane-designer").expect(200);
    expect(slugCheck.body.data.available).toBe(false);

    const reservedSlug = await agent.get("/api/portfolios/slug/admin").expect(200);
    expect(reservedSlug.body.data.available).toBe(false);
    expect(reservedSlug.body.data.message).toMatch(/reserved/i);

    // 2. Reject invalid slug structure
    const badSlugRes = await agent.patch(`/api/portfolios/${portfolioId}`).send({
      slug: "invalid_slug_with_underscores!"
    }).expect(400);
    expect(badSlugRes.body.success).toBe(false);

    // 3. Generate another portfolio with duplicate slug (should be rejected, not silently published under a surprise URL)
    const genDupRes = await agent.post("/api/portfolios/generate").send({
      slug: "jane-designer",
      displayName: "Jane Developer 2",
      theme: "compact"
    }).expect(409);
    expect(genDupRes.body.success).toBe(false);

    // 4. Retrieve public profile details by slug (only returns permitted public fields)
    const publicRes = await request(app).get("/api/portfolios/public/jane-designer").expect(200);
    expect(publicRes.body.success).toBe(true);
    expect(publicRes.body.data.userId).toBeUndefined();
    expect(publicRes.body.data.title).toBe("Jane Developer Portfolio");
    expect(publicRes.body.data.displayName).toBe("Jane Developer");
    expect(publicRes.body.data.contactEmail).toBe("jane@example.com");
    expect(publicRes.body.data.contactPhone).toBe("+1-555-9876");
    expect(publicRes.body.data.resumeUrl).toBe("");

    // 5. Check private portfolio not publicly exposed (unpublish it)
    await agent.post(`/api/portfolios/${portfolioId}/publish`).send({ isPublished: false }).expect(200);

    await request(app).get("/api/portfolios/public/jane-designer").expect(404);
  });

  it("saves, lists, compares, and restores portfolio versions without forcing public visibility", async () => {
    const agent = await authAgent();
    const created = await agent.post("/api/portfolios/generate").send({
      slug: "versioned-portfolio",
      title: "Version One Portfolio",
      displayName: "Versioned Dev",
      headline: "React Developer",
      isPublished: false,
      skills: ["React"],
      projects: [{ title: "Portfolio Builder", description: "Built a portfolio flow", techStack: "React" }]
    }).expect(201);

    const portfolioId = created.body.data._id;
    const version = await agent.post(`/api/portfolios/${portfolioId}/versions`).send({
      versionTitle: "Recruiter draft",
      changeSummary: "Initial recruiter-safe version before proof edits."
    }).expect(201);
    expect(version.body.data.title).toBe("Recruiter draft");
    expect(version.body.data.visibilityStatus).toBe("private");

    const versions = await agent.get(`/api/portfolios/${portfolioId}/versions`).expect(200);
    expect(versions.body.data).toHaveLength(1);
    expect(versions.body.data[0].changeSummary).toMatch(/Initial recruiter-safe/);

    await agent.patch(`/api/portfolios/${portfolioId}`).send({
      title: "Version Two Portfolio",
      isPublished: true,
      skills: ["React", "TypeScript"]
    }).expect(200);

    const comparison = await agent.get(`/api/portfolios/${portfolioId}/versions/${version.body.data.id}/compare`).expect(200);
    expect(comparison.body.data.changedFields.some((field: any) => field.field === "title")).toBe(true);
    expect(comparison.body.data.changedFields.some((field: any) => field.field === "skills")).toBe(true);

    const restored = await agent.post(`/api/portfolios/${portfolioId}/versions/${version.body.data.id}/restore`).send({}).expect(200);
    expect(restored.body.data.title).toBe("Version One Portfolio");
    expect(restored.body.data.skills).toEqual(["React"]);
    expect(restored.body.data.slug).toBe("versioned-portfolio");
    expect(restored.body.data.isPublished).toBe(true);
  });

  it("stores project case studies and proof mappings while public output excludes private proof fields", async () => {
    const agent = await authAgent();
    await agent.post("/api/portfolios/generate").send({
      slug: "proof-portfolio",
      title: "Proof Portfolio",
      displayName: "Proof Dev",
      headline: "MERN Developer",
      isPublished: true,
      sections: {
        showProjects: true,
        showCaseStudies: true,
        showProofMappings: true,
        showLinks: false
      },
      projectCaseStudies: [
        {
          projectName: "AI Job Copilot",
          problemSolved: "Helped organize a job search workflow.",
          techStack: ["React", "Node.js"],
          contribution: "Built the portfolio module.",
          keyFeatures: ["Public slugs", "PDF exports"],
          challenges: "Privacy controls",
          solutionApproach: "Explicit user-controlled visibility.",
          resultLearning: "Learned safer public profile design.",
          githubUrl: "https://github.com/example/private-proof",
          liveDemoUrl: "https://demo.example.com",
          proofStatus: "self-reported",
          isPublic: true,
          privateProofNotes: "Private reviewer notes",
          publicProofNote: "Can explain architecture and tradeoffs.",
          showPublicProofNotes: true
        },
        {
          projectName: "Private Project",
          problemSolved: "Internal details",
          isPublic: false,
          privateProofNotes: "Should never be public"
        }
      ],
      proofMappings: [
        {
          skillName: "React",
          projectName: "AI Job Copilot",
          resumeBullet: "Built recruiter-safe portfolio screens.",
          githubUrl: "https://github.com/example/private-proof",
          confidence: "strong",
          isPublic: true,
          privateNotes: "Private proof note",
          publicNote: "Mapped to visible case-study work.",
          showPublicNotes: true
        },
        {
          skillName: "Docker",
          projectName: "Internal Deployment",
          privateNotes: "Private deployment proof",
          confidence: "weak",
          isPublic: false
        }
      ]
    }).expect(201);

    const publicProfile = await request(app).get("/api/portfolios/public/proof-portfolio").expect(200);
    expect(publicProfile.body.data.userId).toBeUndefined();
    expect(publicProfile.body.data.projectCaseStudies).toHaveLength(1);
    expect(publicProfile.body.data.projectCaseStudies[0].projectName).toBe("AI Job Copilot");
    expect(publicProfile.body.data.projectCaseStudies[0].proofStatus).toBe("self-reported");
    expect(publicProfile.body.data.projectCaseStudies[0].publicProofNote).toMatch(/architecture/);
    expect(publicProfile.body.data.projectCaseStudies[0].privateProofNotes).toBeUndefined();
    expect(publicProfile.body.data.projectCaseStudies[0].githubUrl).toBe("");
    expect(JSON.stringify(publicProfile.body.data)).not.toMatch(/Private reviewer|Should never be public|Private deployment/);

    expect(publicProfile.body.data.proofMappings).toHaveLength(1);
    expect(publicProfile.body.data.proofMappings[0].skillName).toBe("React");
    expect(publicProfile.body.data.proofMappings[0].confidence).toBe("strong");
    expect(publicProfile.body.data.proofMappings[0].privateNotes).toBeUndefined();
    expect(publicProfile.body.data.proofMappings[0].githubUrl).toBe("");
  });

  it("checks GitHub proof readiness and only exposes public-approved GitHub proof links", async () => {
    const agent = await authAgent();
    const status = await agent.get("/api/portfolios/github/status").expect(200);
    expect(status.body.data.provider).toBe("github");
    expect(status.body.data.status).not.toBe("live");

    await agent.post("/api/portfolios/github/check").send({ repoUrl: "https://example.com/test/repo" }).expect(400);

    const checked = await agent.post("/api/portfolios/github/check").send({
      repoUrl: "https://github.com/example/manual-proof",
      projectName: "React Portfolio",
      skillName: "React"
    }).expect(200);
    expect(checked.body.data.repoUrl).toBe("https://github.com/example/manual-proof");
    expect(checked.body.data.confidence).toBe("medium");
    expect(JSON.stringify(checked.body.data)).not.toMatch(/stars|forks|commits|verifiedByGitHub/i);

    await agent.post("/api/portfolios/generate").send({
      slug: "github-proof-portfolio",
      title: "GitHub Proof Portfolio",
      displayName: "GitHub Proof Dev",
      headline: "Evidence-minded engineer",
      isPublished: true,
      sections: {
        showProjects: true,
        showCaseStudies: true,
        showProofMappings: true,
        showLinks: true
      },
      projectCaseStudies: [
        {
          projectName: "Public GitHub Proof",
          problemSolved: "Mapped repository proof to recruiter-facing case studies.",
          githubUrl: "https://github.com/example/manual-proof",
          githubProof: {
            repoUrl: "https://github.com/example/manual-proof",
            evidenceStatus: "manual_repo_link",
            confidence: "medium",
            privateNotes: "Private GitHub reviewer note",
            isPublic: true
          },
          showGitHubProof: true,
          proofStatus: "self-reported",
          isPublic: true
        }
      ],
      proofMappings: [
        {
          skillName: "React",
          projectName: "Private GitHub Proof",
          githubUrl: "https://github.com/example/private-proof",
          githubProof: {
            repoUrl: "https://github.com/example/private-proof",
            evidenceStatus: "manual_repo_link",
            confidence: "medium",
            privateNotes: "Hidden mapping note",
            isPublic: false
          },
          showGitHubProof: false,
          confidence: "medium",
          isPublic: true
        },
        {
          skillName: "Node.js",
          projectName: "Public GitHub Proof",
          githubUrl: "https://github.com/example/manual-proof",
          githubProof: {
            repoUrl: "https://github.com/example/manual-proof",
            evidenceStatus: "manual_repo_link",
            confidence: "medium",
            isPublic: true
          },
          showGitHubProof: true,
          confidence: "medium",
          isPublic: true
        }
      ]
    }).expect(201);

    const publicProfile = await request(app).get("/api/portfolios/public/github-proof-portfolio").expect(200);
    const publicJson = JSON.stringify(publicProfile.body.data);
    expect(publicProfile.body.data.projectCaseStudies[0].githubUrl).toBe("https://github.com/example/manual-proof");
    expect(publicProfile.body.data.projectCaseStudies[0].githubProof.privateNotes).toBeUndefined();
    expect(publicProfile.body.data.projectCaseStudies[0].proofBadge).toBe("GitHub-linked");
    expect(publicProfile.body.data.proofMappings.find((mapping: any) => mapping.skillName === "React").githubUrl).toBe("");
    expect(publicProfile.body.data.proofMappings.find((mapping: any) => mapping.skillName === "Node.js").githubUrl).toBe("https://github.com/example/manual-proof");
    expect(publicJson).not.toMatch(/Private GitHub reviewer|Hidden mapping note|private-proof|stars|forks|commits|verifiedByGitHub/i);
  });

  it("hardens portfolio file metadata and only exposes public-approved proof files", async () => {
    const agent = await authAgent();
    const status = await agent.get("/api/portfolios/storage/status").expect(200);
    expect(status.body.data.status).toBe("local_fallback");
    expect(status.body.data.label).toMatch(/Local fallback/i);
    expect(status.body.data.live).toBe(false);
    const scanStatus = await agent.get("/api/portfolios/scanning/status").expect(200);
    expect(scanStatus.body.data.status).toBe("local_validation");
    expect(scanStatus.body.data.live).toBe(false);
    expect(scanStatus.body.data.label).toMatch(/Local validation/i);

    const created = await agent.post("/api/portfolios/generate").send({
      slug: "storage-proof-portfolio",
      title: "Storage Proof Portfolio",
      displayName: "Storage Dev",
      headline: "Privacy-focused developer",
      isPublished: true,
      sections: {
        showProjects: true,
        showCaseStudies: true,
        showProofMappings: true,
        showLinks: true
      },
      projectCaseStudies: [
        {
          projectName: "Private Storage Hardening",
          problemSolved: "Protected portfolio proof files from accidental public exposure.",
          proofStatus: "self-reported",
          isPublic: true,
          proofFiles: [
            {
              fileId: "private-case-file",
              fileType: "proofFile",
              storageProvider: "local",
              storageKey: "proof/private-case.pdf",
              originalFilename: "private-case.pdf",
              visibility: "private",
              localPath: "C:\\private\\private-case.pdf",
              bucketUrl: "https://private-bucket.example/private-case.pdf"
            },
            {
              fileId: "public-case-file",
              fileType: "proofFile",
              storageProvider: "local",
              storageKey: "proof/public-case.pdf",
              originalFilename: "public-case.pdf",
              visibility: "publicApproved",
              scanStatus: "local_validated",
              isPublicEligible: true
            },
            {
              fileId: "blocked-case-file",
              fileType: "proofFile",
              storageProvider: "local",
              storageKey: "proof/blocked-case.pdf",
              originalFilename: "blocked-case.pdf",
              visibility: "publicApproved",
              scanStatus: "blocked",
              blockedReason: "provider_reported_file_risk",
              isPublicEligible: false
            }
          ]
        }
      ],
      proofMappings: [
        {
          skillName: "Storage Privacy",
          projectName: "Private Storage Hardening",
          confidence: "strong",
          isPublic: true,
          proofFiles: [
            {
              fileId: "private-mapping-file",
              fileType: "proofFile",
              storageProvider: "local",
              storageKey: "proof/private-mapping.pdf",
              originalFilename: "private-mapping.pdf",
              visibility: "private",
              absolutePath: "C:\\private\\private-mapping.pdf"
            },
            {
              fileId: "public-mapping-file",
              fileType: "proofFile",
              storageProvider: "local",
              storageKey: "proof/public-mapping.pdf",
              originalFilename: "public-mapping.pdf",
              visibility: "publicApproved",
              scanStatus: "local_validated",
              isPublicEligible: true
            },
            {
              fileId: "failed-mapping-file",
              fileType: "proofFile",
              storageProvider: "local",
              storageKey: "proof/failed-mapping.pdf",
              originalFilename: "failed-mapping.pdf",
              visibility: "publicApproved",
              scanStatus: "failed",
              blockedReason: "provider_scan_failed",
              isPublicEligible: false
            }
          ]
        }
      ]
    }).expect(201);

    const portfolioId = created.body.data._id;
    const metadata = await agent.post(`/api/portfolios/${portfolioId}/files/metadata`).send({
      fileType: "proofFile",
      storageKey: "proof/architecture.pdf",
      originalFilename: "architecture.pdf",
      mimeType: "application/pdf",
      size: 2048,
      visibility: "private",
      localPath: "C:\\private\\architecture.pdf",
      bucketUrl: "https://private-bucket.example/architecture.pdf"
    }).expect(201);

    expect(metadata.body.data.fileType).toBe("proofFile");
    expect(metadata.body.data.visibility).toBe("private");
    expect(metadata.body.data.downloadUrl).toBe("/uploads/proof/architecture.pdf");
    expect(JSON.stringify(metadata.body.data)).not.toMatch(/C:\\|private-bucket|localPath|absolutePath/);

    const files = await agent.get(`/api/portfolios/${portfolioId}/files`).expect(200);
    expect(files.body.data).toHaveLength(1);
    expect(JSON.stringify(files.body.data)).not.toMatch(/C:\\|private-bucket|localPath|absolutePath/);

    const blockedMetadata = await agent.post(`/api/portfolios/${portfolioId}/files/metadata`).send({
      fileType: "proofFile",
      storageKey: "proof/blocked.pdf",
      originalFilename: "blocked.pdf",
      mimeType: "application/pdf",
      size: 2048,
      visibility: "private",
      scanStatus: "blocked",
      scanProvider: "test-scanner",
      blockedReason: "provider_reported_file_risk",
      isPublicEligible: false
    }).expect(201);
    expect(blockedMetadata.body.data.visibility).toBe("private");
    expect(blockedMetadata.body.data.scanStatus).toBe("blocked");
    await agent.patch(`/api/portfolios/${portfolioId}/files/${blockedMetadata.body.data.fileId}`).send({ visibility: "publicApproved" }).expect(400);

    const publicProfile = await request(app).get("/api/portfolios/public/storage-proof-portfolio").expect(200);
    const publicJson = JSON.stringify(publicProfile.body.data);
    expect(publicProfile.body.data.projectCaseStudies[0].proofFiles).toHaveLength(1);
    expect(publicProfile.body.data.projectCaseStudies[0].proofFiles[0].fileId).toBe("public-case-file");
    expect(publicProfile.body.data.projectCaseStudies[0].proofFiles[0].downloadUrl).toBe("/uploads/proof/public-case.pdf");
    expect(publicProfile.body.data.proofMappings[0].proofFiles).toHaveLength(1);
    expect(publicProfile.body.data.proofMappings[0].proofFiles[0].fileId).toBe("public-mapping-file");
    expect(publicProfile.body.data.proofMappings[0].proofFiles[0].downloadUrl).toBe("/uploads/proof/public-mapping.pdf");
    expect(publicJson).not.toMatch(/private-case|private-mapping|blocked-case|failed-mapping|private-bucket|storageKey|C:\\|absolutePath|localPath/);
  });

  it("uploads user-initiated proof files privately by default and gates signed URLs by ownership", async () => {
    const agent = await authAgent();
    const created = await agent.post("/api/portfolios/generate").send({
      slug: "upload-proof-portfolio",
      title: "Upload Proof Portfolio",
      displayName: "Upload Proof Dev",
      headline: "Full-stack developer",
      isPublished: true,
      sections: {
        showProjects: true,
        showCaseStudies: true,
        showProofMappings: true,
        showLinks: true
      },
      projectCaseStudies: [
        {
          id: "case-upload",
          projectName: "Upload UX",
          problemSolved: "Attached proof files safely.",
          proofStatus: "self-reported",
          isPublic: true
        }
      ]
    }).expect(201);
    const portfolioId = created.body.data._id;
    const pngBuffer = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.from("proof")
    ]);

    await agent.post(`/api/portfolios/${portfolioId}/files/upload`)
      .field("projectId", "case-upload")
      .attach("proofFile", Buffer.from("not allowed"), { filename: "proof.txt", contentType: "text/plain" })
      .expect(400);

    await agent.post(`/api/portfolios/${portfolioId}/files/upload`)
      .field("projectId", "case-upload")
      .attach("proofFile", Buffer.alloc(5.1 * 1024 * 1024), { filename: "big.png", contentType: "image/png" })
      .expect(400);

    const uploaded = await agent.post(`/api/portfolios/${portfolioId}/files/upload`)
      .field("projectId", "case-upload")
      .attach("proofFile", pngBuffer, { filename: "proof.png", contentType: "image/png" })
      .expect(201);

    expect(uploaded.body.data.visibility).toBe("private");
    expect(uploaded.body.data.fileType).toBe("screenshot");
    expect(uploaded.body.data.scanStatus).toBe("local_validated");
    expect(uploaded.body.data.scanProvider).toBe("local-validation");
    expect(uploaded.body.data.isPublicEligible).toBe(true);
    expect(uploaded.body.data.scanSummary).toMatch(/Local validation/i);
    expect(uploaded.body.data.scanStatus).not.toBe("clean");
    expect(uploaded.body.data.downloadUrl).toMatch(/\/uploads\/portfolio-proof\//);
    expect(JSON.stringify(uploaded.body.data)).not.toMatch(/C:\\|private-bucket|localPath|absolutePath/);

    const privatePublicProfile = await request(app).get("/api/portfolios/public/upload-proof-portfolio").expect(200);
    expect(privatePublicProfile.body.data.projectCaseStudies[0].proofFiles).toHaveLength(0);

    const otherAgent = request.agent(app);
    await otherAgent.post("/api/auth/register").send({ fullName: "Other User", email: "other@example.com", password: "Password123!" }).expect(201);
    await otherAgent.get(`/api/portfolios/${portfolioId}/files/${uploaded.body.data.fileId}/signed-url`).expect(404);

    const signed = await agent.get(`/api/portfolios/${portfolioId}/files/${uploaded.body.data.fileId}/signed-url`).expect(200);
    expect(signed.body.data.downloadUrl).toMatch(/\/uploads\/portfolio-proof\//);

    const approved = await agent.patch(`/api/portfolios/${portfolioId}/files/${uploaded.body.data.fileId}`).send({ visibility: "publicApproved" }).expect(200);
    expect(approved.body.data.visibility).toBe("publicApproved");

    const publicProfile = await request(app).get("/api/portfolios/public/upload-proof-portfolio").expect(200);
    expect(publicProfile.body.data.projectCaseStudies[0].proofFiles).toHaveLength(1);
    expect(publicProfile.body.data.projectCaseStudies[0].proofFiles[0].fileId).toBe(uploaded.body.data.fileId);
    expect(publicProfile.body.data.projectCaseStudies[0].proofFiles[0].downloadUrl).toMatch(/\/uploads\/portfolio-proof\//);
    expect(JSON.stringify(publicProfile.body.data)).not.toMatch(/storageKey|C:\\|localPath|absolutePath|private-bucket/);

    await agent.delete(`/api/portfolios/${portfolioId}/files/${uploaded.body.data.fileId}`).expect(200);
    const files = await agent.get(`/api/portfolios/${portfolioId}/files`).expect(200);
    expect(files.body.data).toHaveLength(0);
  });
});
