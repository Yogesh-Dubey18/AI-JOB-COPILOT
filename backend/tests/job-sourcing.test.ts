import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("axios", () => ({ default: { get: vi.fn() } }));

import axios from "axios";
import { app } from "../src/app.js";
import { env } from "../src/config/env.js";
import { runFullAdzunaSync, buildAdzunaSearchPlan, syncAdzunaJobs } from "../src/services/job-providers/adzuna.provider.js";
import { syncArbeitnowJobs } from "../src/services/job-providers/arbeitnow.provider.js";
import { syncRemotiveJobs } from "../src/services/job-providers/remotive.provider.js";
import {
  enrichJobFields,
  extractSkills,
  inferExperience,
  inferJobType,
  inferRemoteType,
  parseSalaryText,
  stripHtml,
  toAnnual
} from "../src/services/job-normalizer.js";
import { getJobSyncStatus, isSyncFresh, listJobSyncRuns, runTrackedSync } from "../src/services/job-sync.service.js";
import { resetMemoryStore } from "../src/utils/memoryStore.js";
import { createRecord, findRecords, updateRecord } from "../src/utils/repository.js";

const mockedGet = vi.mocked(axios.get);

beforeEach(() => {
  resetMemoryStore();
  mockedGet.mockReset();
});

describe("job normalizer", () => {
  it("strips html and entities", () => {
    expect(stripHtml("<p>Hello&nbsp;<b>World</b> &amp; team</p><br/>Next")).toBe("Hello World & team\nNext");
  });

  it("extracts skills with word boundaries across many fields", () => {
    const skills = extractSkills("We use JavaScript, C++, C#, .NET, Node.js, PostgreSQL and NoSQL. Know SEO, Google Analytics, Tally and GST.");
    expect(skills).toEqual(expect.arrayContaining(["JavaScript", "C++", "C#", ".NET", "Node.js", "PostgreSQL", "NoSQL", "SEO", "Google Analytics", "Tally", "GST"]));
    expect(skills).not.toContain("Java");
    expect(skills).not.toContain("SQL");
    expect(skills).not.toContain("Git");
  });

  it("does not mistake common words for skills but understands aliases", () => {
    expect(extractSkills("Ability to excel in a fast paced place. Ready to go the extra mile.")).toEqual([]);
    expect(extractSkills("Advanced Excel and k8s experience, built with ReactJS and golang")).toEqual(expect.arrayContaining(["Excel", "Kubernetes", "React", "Go"]));
  });

  it("keeps provider tags, canonicalising the ones it knows", () => {
    expect(extractSkills("", ["reactjs", "Fintech"])).toEqual(expect.arrayContaining(["React", "Fintech"]));
    expect(extractSkills("", ["All others", "Remote", "a very long generic tag name", "Figma"])).toEqual(["Figma"]);
  });

  it("infers experience instead of calling everything 0-2 years", () => {
    expect(inferExperience("We need 3-5 years of experience")).toBe("3-5 years");
    expect(inferExperience("Minimum 7 years in sales")).toBe("5+ years");
    expect(inferExperience("2+ years experience with React")).toBe("2-4 years");
    expect(inferExperience("1 year of experience")).toBe("1-3 years");
    expect(inferExperience("Great team", "Senior Backend Engineer")).toBe("5+ years");
    expect(inferExperience("Freshers can apply", "Software Engineer")).toBe("0-1 years");
    expect(inferExperience("Join us", "Marketing Intern")).toBe("0-1 years");
    expect(inferExperience("Join us", "Account Executive")).toBe("Not specified");
  });

  it("infers job type and remote type", () => {
    expect(inferJobType("", "contract")).toBe("Contract");
    expect(inferJobType("", ["full time"])).toBe("Full-time");
    expect(inferJobType("", "", "Marketing Intern")).toBe("Internship");
    expect(inferJobType("This is a part-time role")).toBe("Part-time");
    expect(inferJobType("nothing special")).toBe("Full-time");
    expect(inferRemoteType("", true)).toBe("Remote");
    expect(inferRemoteType("Hybrid working, 3 days in office")).toBe("Hybrid");
    expect(inferRemoteType("Work from home available")).toBe("Remote");
    expect(inferRemoteType("Office based in Pune")).toBe("Onsite");
  });

  it("does not mistake internal or international for an internship", () => {
    expect(inferJobType("We build internal tools for an international team")).toBe("Full-time");
    expect(inferJobType("Summer internship programme")).toBe("Internship");
    expect(inferJobType("", "", "Software Engineering Interns")).toBe("Internship");
  });

  it("does not call an on-site job remote just because it mentions remote teams", () => {
    expect(inferRemoteType("On-site role in Pune. You will collaborate with remote teams.")).toBe("Onsite");
    expect(inferRemoteType("This is a remote position, work from anywhere")).toBe("Remote");
    expect(inferRemoteType("Join our remote team")).toBe("Remote");
    expect(inferRemoteType("Fully remote, with an optional hybrid office")).toBe("Hybrid");
  });

  it("parses salaries in different formats", () => {
    expect(parseSalaryText("$80k - $120k")).toEqual({ min: 80000, max: 120000, currency: "USD", period: "year" });
    expect(parseSalaryText("€50.000 - €70.000")).toEqual({ min: 50000, max: 70000, currency: "EUR", period: "year" });
    expect(parseSalaryText("12-18 LPA")).toEqual({ min: 1200000, max: 1800000, currency: "INR", period: "year" });
    expect(toAnnual(parseSalaryText("$50 - $70 per hour"))).toEqual({ min: 104000, max: 145600 });
    expect(toAnnual(parseSalaryText("$4,000/month"))).toEqual({ min: 48000, max: 48000 });
    expect(parseSalaryText("$35,3k - $52k")).toEqual({ min: 35300, max: 52000, currency: "USD", period: "year" });
    expect(parseSalaryText("$1,200,000")).toMatchObject({ min: 1200000 });
    expect(parseSalaryText("Competitive salary")).toEqual({});
    expect(parseSalaryText("")).toEqual({});
  });

  it("enriches a job in one call", () => {
    const fields = enrichJobFields({
      title: "Senior Data Analyst",
      description: "<p>5+ years of experience with SQL, Tableau and Python. Remote friendly.</p>",
      salaryText: "$90k - $110k",
      defaultCurrency: "USD"
    });
    expect(fields.experienceRequired).toBe("5+ years");
    expect(fields.skillsRequired).toEqual(expect.arrayContaining(["SQL", "Tableau", "Python"]));
    expect(fields.remoteType).toBe("Remote");
    expect(fields.salaryMin).toBe(90000);
    expect(fields.currency).toBe("USD");
  });
});

describe("providers use the normalizer", () => {
  it("Remotive keeps real experience, type, skills and salary", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        jobs: [{
          id: 1, title: "Growth Marketer", company_name: "Acme", candidate_required_location: "Worldwide", url: "https://acme.example/jobs/1",
          description: "<p>4+ years of experience in SEO, Google Ads and Content Marketing.</p>", job_type: "contract",
          salary: "$60k - $80k", tags: ["marketing"], category: "Marketing", publication_date: new Date().toISOString()
        }]
      }
    });
    const result = await syncRemotiveJobs(10);
    expect(result.syncedCount).toBe(1);
    const [job] = await findRecords("jobs", {});
    expect(job.experienceRequired).toBe("4-6 years");
    expect(job.jobType).toBe("Contract");
    expect(job.remoteType).toBe("Remote");
    expect(job.salaryMin).toBe(60000);
    expect(job.skillsRequired).toEqual(expect.arrayContaining(["SEO", "Google Ads", "Content Marketing"]));
  });

  it("Arbeitnow no longer pretends every job is 0-2 years", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        data: [{
          slug: "senior-dev-berlin", title: "Senior Java Developer", company_name: "Beta GmbH", location: "Berlin", url: "https://beta.example/1",
          description: "Hybrid role. Java, Spring Boot and Kafka.", tags: [], job_types: ["full time"], remote: false, created_at: Math.floor(Date.now() / 1000)
        }]
      }
    });
    await syncArbeitnowJobs();
    const [job] = await findRecords("jobs", {});
    expect(job.experienceRequired).toBe("5+ years");
    expect(job.remoteType).toBe("Hybrid");
    expect(job.jobType).toBe("Full-time");
    expect(job.skillsRequired).toEqual(expect.arrayContaining(["Java", "Spring Boot", "Kafka"]));
  });

  it("Adzuna ignores predicted (estimated) salaries", async () => {
    env.ADZUNA_APP_ID = "id";
    env.ADZUNA_APP_KEY = "key";
    try {
      mockedGet.mockResolvedValueOnce({
        data: { results: [{ id: "10", title: "Clerk", company: { display_name: "Delta" }, location: { display_name: "Delhi" }, redirect_url: "https://delta.example/10", description: "Office clerk", salary_min: 200000, salary_max: 250000, salary_is_predicted: "1", created: new Date().toISOString() }] }
      });
      await syncAdzunaJobs("clerk", "in", 10, 1, "Delhi");
      const [job] = await findRecords("jobs", {});
      expect(job.salaryMin).toBeUndefined();
      expect(job.salaryMax).toBeUndefined();
    } finally {
      env.ADZUNA_APP_ID = "";
      env.ADZUNA_APP_KEY = "";
    }
  });

  it("Adzuna maps contract time and numeric salaries", async () => {
    env.ADZUNA_APP_ID = "id";
    env.ADZUNA_APP_KEY = "key";
    try {
      mockedGet.mockResolvedValueOnce({
        data: {
          results: [{
            id: "9", title: "Accounts Executive", company: { display_name: "Gamma" }, location: { display_name: "Pune" }, redirect_url: "https://gamma.example/9",
            description: "Part-time position. Tally, GST and Excel formulas. 2 years of experience.", contract_time: "part_time", salary_min: 300000, salary_max: 400000,
            category: { label: "Accounting & Finance Jobs" }, created: new Date().toISOString()
          }]
        }
      });
      const result = await syncAdzunaJobs("accountant", "in", 10, 1, "Pune");
      expect(result.syncedCount).toBe(1);
      const [job] = await findRecords("jobs", {});
      expect(job.jobType).toBe("Part-time");
      expect(job.experienceRequired).toBe("2-4 years");
      expect(job.currency).toBe("INR");
      expect(job.salaryMin).toBe(300000);
      expect(job.skillsRequired).toEqual(expect.arrayContaining(["Tally", "GST", "Excel"]));
    } finally {
      env.ADZUNA_APP_ID = "";
      env.ADZUNA_APP_KEY = "";
    }
  });
});

describe("adzuna search plan", () => {
  it("puts user roles and cities first, skips remote and duplicates, honours the cap", () => {
    const plan = buildAdzunaSearchPlan(
      [
        { targetRoles: ["Data Analyst", "data analyst", "Marketing Manager"], preferredLocations: ["Pune", "Remote", "Pune"] },
        { targetRoles: ["Data Analyst"], preferredLocations: ["Jaipur"] }
      ],
      500
    );
    expect(plan[0]).toEqual({ what: "Data Analyst", where: "Pune", page: 1 });
    expect(plan.some((s) => s.what === "Marketing Manager" && s.where === "Jaipur")).toBe(true);
    expect(plan.some((s) => /remote/i.test(s.where))).toBe(false);
    expect(plan.filter((s) => s.what === "Data Analyst" && s.where === "Pune")).toHaveLength(1);
    expect(plan.some((s) => s.what === "developer" && s.category === "it-jobs")).toBe(true);
    expect(buildAdzunaSearchPlan([], 10)).toHaveLength(10);
  });

  it("runFullAdzunaSync skips cleanly without credentials", async () => {
    const result = await runFullAdzunaSync();
    expect(result.totalSynced).toBe(0);
    expect(result.message).toMatch(/not configured/i);
    expect(mockedGet).not.toHaveBeenCalled();
  });
});

describe("job sync tracking", () => {
  it("records completed, failed and skipped runs without throwing", async () => {
    const ok = await runTrackedSync("remotive", "cron", async () => ({ syncedCount: 4 }));
    const failed = await runTrackedSync("arbeitnow", "cron", async () => ({ syncedCount: 0, error: "boom" }));
    const thrown = await runTrackedSync("adzuna", "admin", async () => { throw new Error("network down"); });
    const skipped = await runTrackedSync("adzuna", "startup", async () => ({ totalSynced: 0, message: "Adzuna credentials not configured" }));
    expect([ok.status, failed.status, thrown.status, skipped.status]).toEqual(["completed", "failed", "failed", "skipped"]);
    expect(ok.importedCount).toBe(4);
    expect(thrown.error).toBe("network down");
    expect(await listJobSyncRuns()).toHaveLength(4);
    const status = await getJobSyncStatus();
    expect(status.find((s) => s.source === "remotive")?.lastStatus).toBe("completed");
    expect(status.find((s) => s.source === "arbeitnow")?.lastError).toBe("boom");
  });

  it("isSyncFresh only when every source succeeded recently", async () => {
    expect(await isSyncFresh(5)).toBe(false);
    for (const source of ["adzuna", "remotive", "arbeitnow"]) await runTrackedSync(source, "cron", async () => ({ syncedCount: 1 }));
    expect(await isSyncFresh(5)).toBe(true);
    expect(await isSyncFresh(5, Date.now() + 6 * 60 * 60 * 1000)).toBe(false);
    const [first] = await findRecords("jobSyncRuns", { source: "remotive" });
    await updateRecord("jobSyncRuns", String(first._id), { status: "failed" });
    expect(await isSyncFresh(5)).toBe(false);
  });

  it("exposes sync status to admins only", async () => {
    await runTrackedSync("remotive", "cron", async () => ({ syncedCount: 2 }));
    const user = request.agent(app);
    await user.post("/api/auth/register").send({ fullName: "Normal User", email: "normal@example.com", password: "Password123!" }).expect(201);
    await user.get("/api/admin/job-sync/status").expect(403);

    const admin = request.agent(app);
    const reg = await admin.post("/api/auth/register").send({ fullName: "Admin User", email: "boss@example.com", password: "Password123!" }).expect(201);
    await updateRecord("users", reg.body.data.user.id, { role: "admin" });
    const status = await admin.get("/api/admin/job-sync/status").expect(200);
    expect(status.body.data.find((s: any) => s.source === "remotive").lastImportedCount).toBe(2);
    const runs = await admin.get("/api/admin/job-sync/runs?limit=5").expect(200);
    expect(runs.body.data).toHaveLength(1);
    await createRecord("jobSyncRuns", { source: "adzuna", status: "failed", startedAt: new Date(), error: "x" });
    expect((await admin.get("/api/admin/job-sync/runs").expect(200)).body.data).toHaveLength(2);
  });
});
