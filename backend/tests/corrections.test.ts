import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import { resetMemoryStore } from "../src/utils/memoryStore.js";
import { createRecord, countRecords, findRecords, findOneRecord, updateRecord } from "../src/utils/repository.js";
import { listJobs, refreshJobs, ensureSampleJobs } from "../src/services/job.service.js";
import { syncAdzunaJobs } from "../src/services/job-providers/adzuna.provider.js";
import { normalizeJobSourceJob } from "../src/services/job-source.service.js";
import { env } from "../src/config/env.js";
import axios from "axios";

vi.mock("axios", async () => {
  const actual = await vi.importActual<any>("axios");
  return {
    default: {
      ...actual.default,
      get: vi.fn().mockImplementation((url: string) => {
        if (url.includes("remotive")) {
          return Promise.resolve({ data: { jobs: [] } });
        }
        if (url.includes("arbeitnow")) {
          return Promise.resolve({ data: { data: [] } });
        }
        return actual.default.get(url);
      })
    }
  };
});

async function authAgent() {
  const agent = request.agent(app);
  await agent.post("/api/auth/register").send({ fullName: "Corrections User", email: "corrections@example.com", password: "Password123!" }).expect(201);
  return agent;
}

describe("AI Job Copilot - Corrections & Upgrade Verification", () => {
  beforeEach(async () => {
    resetMemoryStore();
    await ensureSampleJobs();
  });

  it("a. Adzuna sync twice with the same fixture data - does NOT increase job document count", async () => {
    // Setup env credentials directly on env config object so provider doesn't skip
    const originalAppId = env.ADZUNA_APP_ID;
    const originalAppKey = env.ADZUNA_APP_KEY;
    env.ADZUNA_APP_ID = "mock_id";
    env.ADZUNA_APP_KEY = "mock_key";

    const fakeAdzunaResponse = {
      data: {
        results: [
          {
            id: "adzuna-job-123",
            title: "Verification Engineer",
            company: { display_name: "Mock Co" },
            location: { display_name: "Bengaluru" },
            redirect_url: "https://example.com/apply/adzuna-123",
            description: "Looking for a React developer with Python skills.",
            category: { label: "IT Jobs" },
            created: new Date().toISOString()
          }
        ]
      }
    };

    const axiosSpy = vi.spyOn(axios, "get").mockResolvedValue(fakeAdzunaResponse);

    try {
      const initialCount = await countRecords("jobs");
      
      // First run - Syncs new job
      const run1 = await syncAdzunaJobs("developer", "in", 50, 1);
      const afterRun1Count = await countRecords("jobs");
      expect(run1.syncedCount).toBe(1);
      expect(afterRun1Count).toBe(initialCount + 1);

      // Second run - Upsert / Deduplicate, should NOT increase job document count
      const run2 = await syncAdzunaJobs("developer", "in", 50, 1);
      const afterRun2Count = await countRecords("jobs");
      expect(run2.syncedCount).toBe(0);
      expect(afterRun2Count).toBe(afterRun1Count);
    } finally {
      axiosSpy.mockRestore();
      env.ADZUNA_APP_ID = originalAppId;
      env.ADZUNA_APP_KEY = originalAppKey;
    }
  });

  it("b. Seed job outside active window - does NOT appear in active query", async () => {
    // Clean seed list first
    await resetMemoryStore();

    // Active job
    await createRecord("jobs", normalizeJobSourceJob({
      title: "Active Developer",
      company: "Company Active",
      location: "Remote",
      applyUrl: "https://example.com/active",
      expiresAt: new Date(Date.now() + 86400000) // Tomorrow
    }));

    // Expired job
    await createRecord("jobs", normalizeJobSourceJob({
      title: "Expired Developer",
      company: "Company Expired",
      location: "Remote",
      applyUrl: "https://example.com/expired",
      expiresAt: new Date(Date.now() - 86400000) // Yesterday
    }));

    const result = await listJobs();
    const titles = result.items.map((j: any) => j.title);
    expect(titles).toContain("Active Developer");
    expect(titles).not.toContain("Expired Developer");
  });

  it("c. Seed jobs relative to fake lastJobsViewedAt - new since last visit matches exactly", async () => {
    // Reset store so sample jobs don't interfere with counts
    await resetMemoryStore();

    const userRes = await request(app).post("/api/auth/register").send({ fullName: "Visit User", email: "visit@example.com", password: "Password123!" }).expect(201);
    const userId = userRes.body.data.user.id;

    const profile = await findOneRecord("profiles", { userId });
    await updateRecord("profiles", String(profile._id), {
      ...profile,
      lastJobsViewedAt: new Date(Date.now() - 3600000) // 1 hour ago
    });

    const jobOld = await createRecord("jobs", normalizeJobSourceJob({
      title: "Old Job",
      company: "Company Old",
      location: "Remote",
      applyUrl: "https://example.com/old",
      importedAt: new Date(Date.now() - 7200000), // 2 hours ago
      createdAt: new Date(Date.now() - 7200000)
    }));

    const jobNew = await createRecord("jobs", normalizeJobSourceJob({
      title: "New Job",
      company: "Company New",
      location: "Remote",
      applyUrl: "https://example.com/new",
      importedAt: new Date(Date.now() - 600000), // 10 minutes ago
      createdAt: new Date(Date.now() - 600000)
    }));

    const result = await listJobs({ userId });
    const oldRes = result.items.find((j: any) => String(j._id) === String(jobOld._id));
    const newRes = result.items.find((j: any) => String(j._id) === String(jobNew._id));

    expect(oldRes.isNew).toBe(false);
    expect(newRes.isNew).toBe(true);

    const newJobsCount = result.items.filter((j: any) => j.isNew).length;
    expect(newJobsCount).toBe(1);
  });

  it("d. Call apply-job twice for same jobId - exactly ONE application exists with Applied status", async () => {
    const agent = await authAgent();
    const me = await agent.get("/api/auth/me").expect(200);
    const userId = me.body.data.id;

    const job = await createRecord("jobs", normalizeJobSourceJob({
      title: "Apply Target Developer",
      company: "Company Target",
      location: "Remote",
      applyUrl: "https://example.com/target"
    }));

    // Step 1: Save job (status Saved)
    await agent.post(`/api/jobs/${job._id}/save`).expect(201);
    const appsSaved = await findRecords("applications", { userId });
    expect(appsSaved.length).toBe(1);
    expect(appsSaved[0].status).toBe("Saved");

    // Step 2: Apply to job (updates status to Applied, no duplicate created)
    await agent.post(`/api/jobs/${job._id}/apply`).expect(201);
    const appsApplied = await findRecords("applications", { userId });
    expect(appsApplied.length).toBe(1);
    expect(appsApplied[0].status).toBe("Applied");
  });

  it("e. Seed known counts - dashboard counter endpoint returns exact numbers", async () => {
    // Reset memory store first so default user seed and other states don't mismatch
    await resetMemoryStore();

    const agent = await authAgent();
    const me = await agent.get("/api/auth/me").expect(200);
    const userId = me.body.data.id;
    
    // Seed 5 jobs
    for (let i = 0; i < 5; i++) {
      await createRecord("jobs", normalizeJobSourceJob({
        title: `Job ${i}`,
        company: `Company ${i}`,
        location: "Remote",
        applyUrl: `https://example.com/job-${i}`
      }));
    }

    // Seed applications
    await createRecord("applications", { userId, company: "Co A", role: "Role A", status: "Saved" });
    await createRecord("applications", { userId, company: "Co B", role: "Role B", status: "Applied" });
    await createRecord("applications", { userId, company: "Co C", role: "Role C", status: "Applied" });
    await createRecord("applications", { userId, company: "Co D", role: "Role D", status: "Interview Scheduled" });
    await createRecord("applications", { userId, company: "Co E", role: "Role E", status: "Offer" });

    const response = await agent.get("/api/analytics/overview").expect(200);
    const metrics = response.body.data;

    expect(metrics.totalDiscovered).toBe(5);
    expect(metrics.totalSavedJobs).toBe(1);
    expect(metrics.totalApplied).toBe(4);
    expect(metrics.totalInterviews).toBe(2);
    expect(metrics.totalOffers).toBe(1);
  });

  it("f. Refresh cooldown enforces cooldown when process.env.NODE_ENV !== test", async () => {
    const originalEnv = process.env.NODE_ENV;
    
    // Mock syncAdzunaJobs so it doesn't try calling axios
    const adzunaMock = vi.spyOn(await import("../src/services/job-providers/adzuna.provider.js"), "syncAdzunaJobs");
    adzunaMock.mockResolvedValue({ syncedCount: 2, message: "Sync successful" });

    try {
      process.env.NODE_ENV = "development";
      
      const userRes = await request(app).post("/api/auth/register").send({ fullName: "Cooldown User", email: "cooldown@example.com", password: "Password123!" }).expect(201);
      const userId = userRes.body.data.user.id;

      // First run - Success
      const res1 = await refreshJobs(userId);
      expect(res1.success).toBe(true);
      expect(res1.newJobsCount).toBe(2);
      expect(res1.cooldownRemainingMs).toBeGreaterThan(0);

      // Second run - Triggers cooldown
      const res2 = await refreshJobs(userId);
      expect(res2.message).toContain("cooldown active");
      expect(res2.cooldownRemainingMs).toBeGreaterThan(0);
    } finally {
      adzunaMock.mockRestore();
      process.env.NODE_ENV = originalEnv;
    }
  });

  it("g. Remotive and Arbeitnow sync functions fetch, parse, and save jobs correctly", async () => {
    const { syncRemotiveJobs } = await import("../src/services/job-providers/remotive.provider.js");
    const { syncArbeitnowJobs } = await import("../src/services/job-providers/arbeitnow.provider.js");

    const fakeRemotiveResponse = {
      data: {
        jobs: [
          {
            id: 2091000,
            url: "https://remotive.com/remote-jobs/product/staff-product-engineer-2091000",
            title: "Staff Product Engineer",
            company_name: "LawnStarter",
            category: "Product Management",
            tags: ["React", "PHP"],
            job_type: "full_time",
            publication_date: "2026-06-23T08:31:36",
            candidate_required_location: "Brazil",
            salary: "$80k - $100k",
            description: "Looking for a React developer."
          }
        ]
      }
    };

    const fakeArbeitnowResponse = {
      data: {
        data: [
          {
            slug: "testmanager-munich-360351",
            company_name: "MY Humancapital GmbH",
            title: "Testmanager",
            description: "Testmanager Software und Systemtests",
            remote: true,
            url: "https://www.arbeitnow.com/jobs/testmanager-munich-360351",
            tags: ["Software Development"],
            job_types: ["Full-time"],
            location: "Munich",
            created_at: 1782372650
          }
        ]
      }
    };

    const axiosSpy = vi.spyOn(axios, "get").mockImplementation((url: string) => {
      if (url.includes("remotive")) {
        return Promise.resolve(fakeRemotiveResponse);
      }
      if (url.includes("arbeitnow")) {
        return Promise.resolve(fakeArbeitnowResponse);
      }
      return Promise.reject(new Error("Unexpected request"));
    });

    try {
      const initialCount = await countRecords("jobs");

      // Sync Remotive
      const remRes = await syncRemotiveJobs(50);
      expect(remRes.syncedCount).toBe(1);

      // Sync Arbeitnow
      const arbRes = await syncArbeitnowJobs();
      expect(arbRes.syncedCount).toBe(1);

      const finalCount = await countRecords("jobs");
      expect(finalCount).toBe(initialCount + 2);

      // Find synced jobs in DB
      const remJob = await findOneRecord("jobs", { source: "Remotive" });
      expect(remJob).toBeDefined();
      expect(remJob.title).toBe("Staff Product Engineer");
      expect(remJob.company).toBe("LawnStarter");
      expect(remJob.currency).toBe("USD");
      expect(remJob.salaryMin).toBe(80000);
      expect(remJob.salaryMax).toBe(100000);
      expect(remJob.sourceType).toBe("api-provider");

      const arbJob = await findOneRecord("jobs", { source: "Arbeitnow" });
      expect(arbJob).toBeDefined();
      expect(arbJob.title).toBe("Testmanager");
      expect(arbJob.company).toBe("MY Humancapital GmbH");
      expect(arbJob.currency).toBe("EUR");
      expect(arbJob.remoteType).toBe("Remote");
      expect(arbJob.sourceType).toBe("api-provider");
    } finally {
      axiosSpy.mockRestore();
    }
  });
});
