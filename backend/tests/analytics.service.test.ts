import { beforeEach, describe, expect, it } from "vitest";
import { getAnalyticsOverview } from "../src/services/analytics.service.js";
import { resetMemoryStore } from "../src/utils/memoryStore.js";
import { createRecord } from "../src/utils/repository.js";

describe("analytics overview data integrity", () => {
  beforeEach(async () => {
    await resetMemoryStore();
  });

  it("does not invent ATS scores, application history, or pipeline records for a new user", async () => {
    const analytics = await getAnalyticsOverview("new-user");

    expect(analytics.averageAtsScore).toBeNull();
    expect(analytics.resumeScoreTrend).toEqual([]);
    expect(analytics.applicationStatusChart).toEqual([]);
    expect(analytics.weeklyApplicationChart).toHaveLength(7);
    expect(analytics.weeklyApplicationChart.every((day) => day.applications === 0)).toBe(true);
  });

  it("counts only this user's non-saved applications from the last seven UTC calendar days", async () => {
    const today = new Date();
    const startOfToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const yesterday = new Date(startOfToday);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const outsideWindow = new Date(startOfToday);
    outsideWindow.setUTCDate(outsideWindow.getUTCDate() - 8);

    await createRecord("applications", { userId: "user-a", company: "Today", role: "Engineer", status: "Applied", appliedDate: startOfToday });
    await createRecord("applications", { userId: "user-a", company: "Yesterday", role: "Engineer", status: "Interview Scheduled", appliedDate: yesterday });
    await createRecord("applications", { userId: "user-a", company: "Saved", role: "Engineer", status: "Saved", appliedDate: startOfToday });
    await createRecord("applications", { userId: "user-a", company: "Old", role: "Engineer", status: "Applied", appliedDate: outsideWindow });
    await createRecord("applications", { userId: "user-b", company: "Other user", role: "Engineer", status: "Applied", appliedDate: startOfToday });

    const analytics = await getAnalyticsOverview("user-a");
    const buckets = analytics.weeklyApplicationChart;

    expect(buckets).toHaveLength(7);
    expect(buckets.reduce((sum, day) => sum + day.applications, 0)).toBe(2);
    expect(buckets.at(-1)?.applications).toBe(1);
    expect(buckets.at(-2)?.applications).toBe(1);
  });

  it("distinguishes responses from interviews and ignores analyses without numeric scores", async () => {
    const userId = "analytics-owner";
    for (const status of ["HR Call", "Assignment", "Applied", "Rejected", "Withdrawn", "Saved", "Selected"]) {
      await createRecord("applications", { userId, company: status, role: "Engineer", status });
    }
    await createRecord("applications", { userId: "another-user", company: "Other", role: "Engineer", status: "HR Call" });
    await createRecord("resumeAnalyses", { userId, atsScore: 0 });
    await createRecord("resumeAnalyses", { userId, atsScore: 90 });
    await createRecord("resumeAnalyses", { userId, missingScore: true });

    const analytics = await getAnalyticsOverview(userId);
    expect(analytics.totalApplied).toBe(6);
    expect(analytics.totalInterviews).toBe(2);
    expect(analytics.totalShortlisted).toBe(3);
    expect(analytics.totalOffers).toBe(1);
    expect(analytics.responseRate).toBe(67);
    expect(analytics.interviewRate).toBe(33);
    expect(analytics.averageAtsScore).toBe(45);
    expect(analytics.resumeScoreTrend).toHaveLength(2);
  });
});
