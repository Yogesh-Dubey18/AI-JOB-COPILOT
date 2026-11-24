import { beforeEach, describe, expect, it } from "vitest";
import { cleanupDuplicates, createManualJob, findDuplicateJobGroups } from "../src/services/job.service.js";
import { canonicalJobKey, mergeJobRecords } from "../src/services/job-source.service.js";
import { resetMemoryStore } from "../src/utils/memoryStore.js";
import { createRecord, findRecordById, findRecords } from "../src/utils/repository.js";

beforeEach(() => resetMemoryStore());

const baseJob = {
  title: "Senior Developer",
  company: "Acme",
  location: "Bengaluru",
  description: "Short text",
  applyUrl: "https://adzuna.example/redirect/1",
  source: "Adzuna Jobs",
  skillsRequired: ["React"],
  postedAt: new Date("2026-11-01"),
  expiresAt: new Date("2026-12-01")
};

describe("canonicalJobKey", () => {
  it("treats the same vacancy written differently as one key", () => {
    const a = canonicalJobKey("Sr. Developer (m/f/d)", "Acme Pvt. Ltd.", "Bangalore, Karnataka, India");
    const b = canonicalJobKey("Senior Developer", "ACME", "Bengaluru");
    expect(a).toBe(b);
    expect(a).toBe("senior developer|acme|bengaluru");
    expect(canonicalJobKey("Developer", "Acme GmbH", "Worldwide")).toBe(canonicalJobKey("Developer", "Acme Inc", "Remote"));
  });

  it("ignores noise words in the title such as remote, hybrid and urgent", () => {
    expect(canonicalJobKey("Urgent Hiring: Developer - Remote", "Acme", "Pune")).toBe(canonicalJobKey("Developer", "Acme", "Pune"));
  });

  it("keeps different cities, companies and roles apart", () => {
    const base = canonicalJobKey("Developer", "Acme", "Pune");
    expect(canonicalJobKey("Developer", "Acme", "Mumbai")).not.toBe(base);
    expect(canonicalJobKey("Developer", "Beta", "Pune")).not.toBe(base);
    expect(canonicalJobKey("Designer", "Acme", "Pune")).not.toBe(base);
    expect(canonicalJobKey("", "Acme", "Pune")).toBe("");
  });
});

describe("mergeJobRecords", () => {
  const existing = { _id: "1", createdAt: new Date("2026-11-01"), ...baseJob, trustScore: 70, scamRiskScore: 10, riskFlags: [] as string[] };
  const incoming = {
    ...baseJob, source: "Remotive", applyUrl: "https://remotive.example/jobs/9", description: "A much longer and richer description of the role",
    salaryMin: 90000, salaryMax: 120000, currency: "USD", skillsRequired: ["TypeScript"], experienceRequired: "5+ years", trustScore: 90, scamRiskScore: 30,
    riskFlags: ["Personal email"], postedAt: new Date("2026-10-28")
  };

  it("keeps the original as primary, fills gaps and remembers the other listing", () => {
    const merged = mergeJobRecords(existing, incoming);
    expect(merged.source).toBe("Adzuna Jobs");
    expect(merged.applyUrl).toBe(existing.applyUrl);
    expect(merged.description).toBe(incoming.description);
    expect(merged.salaryMin).toBe(90000);
    expect(merged.currency).toBe("USD");
    expect(merged.experienceRequired).toBe("5+ years");
    expect(merged.skillsRequired).toEqual(["React", "TypeScript"]);
    expect(merged.postedAt).toEqual(incoming.postedAt);
    expect(merged.trustScore).toBe(90);
    expect(merged.scamRiskScore).toBe(30);
    expect(merged.riskFlags).toEqual(["Personal email"]);
    expect(merged.alternateSources).toEqual([expect.objectContaining({ source: "Remotive", applyUrl: incoming.applyUrl })]);
    expect(merged._id).toBeUndefined();
    expect(merged.createdAt).toBeUndefined();
  });

  it("a refresh of the same listing lets old risk signals clear", () => {
    const risky = { ...existing, riskFlags: ["Personal email"], scamRiskScore: 40, reviewStatus: "needs_review", skillsRequired: ["Old"] };
    const refreshed = mergeJobRecords(risky, { ...baseJob, riskFlags: [], scamRiskScore: 8, skillsRequired: ["New"] }, { preferIncoming: true });
    expect(refreshed.riskFlags).toEqual([]);
    expect(refreshed.scamRiskScore).toBe(8);
    expect(refreshed.skillsRequired).toEqual(["New"]);
  });

  it("a listing from another board that brings new risk flags sends the job back to review", () => {
    const approved = { ...existing, reviewStatus: "approved", riskFlags: [] as string[] };
    const merged = mergeJobRecords(approved, incoming);
    expect(merged.riskFlags).toEqual(["Personal email"]);
    expect(merged.reviewStatus).toBe("needs_review");
    const clean = mergeJobRecords(approved, { ...incoming, riskFlags: [] });
    expect(clean.reviewStatus).toBe("approved");
  });

  it("does not duplicate alternate sources when merged twice", () => {
    const once = mergeJobRecords(existing, incoming);
    const twice = mergeJobRecords({ ...existing, ...once }, incoming);
    expect(twice.alternateSources).toHaveLength(1);
  });

  it("same source refresh overwrites, but a gap-fill merge does not", () => {
    const refreshed = mergeJobRecords(existing, { ...baseJob, description: "Updated", skillsRequired: ["Vue"] }, { preferIncoming: true });
    expect(refreshed.description).toBe("Updated");
    expect(refreshed.alternateSources).toEqual([]);
    const gapFill = mergeJobRecords(existing, { ...baseJob, description: "x", salaryMin: 5 }, { preferIncoming: false });
    expect(gapFill.description).toBe("Short text");
    expect(gapFill.salaryMin).toBe(5);
  });
});

describe("cross-source ingestion", () => {
  it("stores one job for the same vacancy from two boards and keeps both apply links", async () => {
    const first = await createManualJob({ ...baseJob, title: "Sr. Developer", company: "Acme Pvt Ltd", location: "Bangalore, India" });
    expect(first.duplicate).toBe(false);
    const second = await createManualJob({ ...baseJob, source: "Remotive", applyUrl: "https://remotive.example/jobs/9", description: "A much longer description of the role and team" });
    expect(second.duplicate).toBe(true);
    expect(second.mergedFromOtherSource).toBe(true);
    const jobs = await findRecords("jobs", {});
    expect(jobs).toHaveLength(1);
    expect(jobs[0].source).toBe("Adzuna Jobs");
    expect(jobs[0].alternateSources).toHaveLength(1);
    expect(jobs[0].alternateSources[0].source).toBe("Remotive");
    expect(jobs[0].description).toMatch(/longer description/);
    expect(jobs[0].canonicalKey).toBe("senior developer|acme|bengaluru");
  });

  it("a same-source refresh updates in place without adding alternates", async () => {
    await createManualJob(baseJob);
    const again = await createManualJob({ ...baseJob, description: "Refreshed text" });
    expect(again.mergedFromOtherSource).toBe(false);
    const jobs = await findRecords("jobs", {});
    expect(jobs).toHaveLength(1);
    expect(jobs[0].description).toBe("Refreshed text");
    expect(jobs[0].alternateSources || []).toHaveLength(0);
  });
});

describe("cleanupDuplicates", () => {
  it("merges old duplicates, re-points user records and never orphans an application", async () => {
    const keep = await createRecord("jobs", { ...baseJob, title: "Sr. Developer", company: "Acme Pvt Ltd", location: "Bangalore", description: "tiny" });
    const dupA = await createRecord("jobs", { ...baseJob, source: "Remotive", applyUrl: "https://remotive.example/9", description: "A far more detailed description with many words", salaryMin: 100 });
    const dupB = await createRecord("jobs", { ...baseJob, source: "Arbeitnow", applyUrl: "https://arbeitnow.example/9" });
    const other = await createRecord("jobs", { ...baseJob, title: "Designer" });
    const appOnKeep = await createRecord("applications", { userId: "u1", jobId: String(keep._id), status: "Saved" });
    const appOnDup = await createRecord("applications", { userId: "u2", jobId: String(dupA._id), status: "Applied" });
    const matchOnDup = await createRecord("jobMatches", { userId: "u2", jobId: String(dupB._id), score: 80 });

    const result = await cleanupDuplicates();
    expect(result.removed).toBe(2);
    expect(result.repointed).toBe(2);

    const jobs = await findRecords("jobs", {});
    expect(jobs).toHaveLength(2);
    const survivor = jobs.find((job: any) => job.title !== "Designer");
    expect(String(survivor._id)).not.toBe(String(other._id));
    expect(survivor.canonicalKey).toBe("senior developer|acme|bengaluru");
    expect(survivor.description).toMatch(/far more detailed/);
    expect(survivor.salaryMin).toBe(100);
    // Equal user references on all three, so the most complete listing (Remotive) stays primary.
    expect(survivor.source).toBe("Remotive");
    expect(survivor.alternateSources.map((item: any) => item.source).sort()).toEqual(["Adzuna Jobs", "Arbeitnow"]);

    // Every user record now points at a job that still exists.
    for (const [collection, record] of [["applications", appOnKeep], ["applications", appOnDup], ["jobMatches", matchOnDup]] as const) {
      const fresh = await findRecordById(collection, String(record._id));
      expect(String(fresh.jobId)).toBe(String(survivor._id));
    }
    void dupA;
    void dupB;
  });

  it("keeps the job users already interact with and is idempotent", async () => {
    const plain = await createRecord("jobs", { ...baseJob, description: "x".repeat(2000), salaryMin: 5 });
    const referenced = await createRecord("jobs", { ...baseJob, source: "Remotive", applyUrl: "https://remotive.example/1", description: "short" });
    await createRecord("applications", { userId: "u1", jobId: String(referenced._id), status: "Applied" });

    const first = await cleanupDuplicates();
    expect(first.removed).toBe(1);
    const jobs = await findRecords("jobs", {});
    expect(jobs).toHaveLength(1);
    expect(String(jobs[0]._id)).toBe(String(referenced._id));
    expect(jobs[0].description).toBe("x".repeat(2000));
    void plain;

    const second = await cleanupDuplicates();
    expect(second).toEqual({ removed: 0, repointed: 0, backfilled: 0 });
  });

  it("findDuplicateJobGroups groups by canonical key without a database", () => {
    const groups = findDuplicateJobGroups([
      { _id: "1", title: "Developer", company: "Acme Inc", location: "Pune" },
      { _id: "2", title: "Developer", company: "ACME", location: "Pune, India" },
      { _id: "3", title: "Developer", company: "Acme", location: "Delhi" }
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].items.map((job: any) => job._id)).toEqual(["1", "2"]);
  });
});
