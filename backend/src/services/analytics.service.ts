import { findRecords, countRecords } from "../utils/repository.js";
import { getJobSearchIntelligence } from "./job-search-intelligence.service.js";

const interviewStageStatuses = new Set([
  "Interview Scheduled", "HR Call", "Technical Round", "Technical Round 1", "Technical Round 2", "Managerial Round", "HR Round", "Offer", "Selected"
]);
const shortlistStatuses = new Set([...interviewStageStatuses, "Assignment"]);
const noResponseStatuses = new Set(["Saved", "Applied", "Withdrawn"]);

function validDate(value: unknown) {
  if (!value) return null;
  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildWeeklyApplicationChart(applications: any[], now = new Date()) {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const buckets = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (6 - index));
    return {
      date: date.toISOString().slice(0, 10),
      name: new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(date),
      applications: 0
    };
  });
  const bucketByDate = new Map(buckets.map((bucket) => [bucket.date, bucket]));

  applications.forEach((application) => {
    if (application.status === "Saved") return;
    const date = validDate(application.appliedDate) || validDate(application.createdAt);
    if (!date) return;
    const key = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString().slice(0, 10);
    const bucket = bucketByDate.get(key);
    if (bucket) bucket.applications += 1;
  });

  return buckets;
}

export async function getAnalyticsOverview(userId: string) {
  const [applications, analyses, jobSearchHealth, totalDiscovered] = await Promise.all([
    findRecords("applications", { userId }),
    findRecords("resumeAnalyses", { userId }, { sort: { createdAt: 1 } }),
    getJobSearchIntelligence(userId),
    countRecords("jobs")
  ]);
  const totalApplied = applications.filter((app: any) => app.status !== "Saved").length;
  const totalInterviews = applications.filter((app: any) => interviewStageStatuses.has(app.status)).length;
  const totalRejected = applications.filter((app: any) => app.status === "Rejected").length;
  const totalOffers = applications.filter((app: any) => app.status === "Offer").length;
  const scoredAnalyses = analyses.filter((item: any) => Number.isFinite(item.atsScore));
  const averageAtsScore = scoredAnalyses.length ? Math.round(scoredAnalyses.reduce((sum: number, item: any) => sum + item.atsScore, 0) / scoredAnalyses.length) : null;
  const totalResponses = applications.filter((app: any) => !noResponseStatuses.has(app.status)).length;
  const statusCounts = applications.reduce((acc: Record<string, number>, app: any) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});
  const sourceCounts = applications.reduce((acc: Record<string, number>, app: any) => {
    const source = app.applicationSource || "Manual";
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});
  return {
    totalDiscovered,
    totalSavedJobs: applications.filter((app: any) => app.status === "Saved").length,
    totalApplied,
    totalShortlisted: applications.filter((app: any) => shortlistStatuses.has(app.status)).length,
    totalInterviews,
    totalRejected,
    totalOffers: totalOffers + applications.filter((app: any) => app.status === "Selected").length,
    responseRate: totalApplied ? Math.round((totalResponses / totalApplied) * 100) : 0,
    interviewRate: totalApplied ? Math.round((totalInterviews / totalApplied) * 100) : 0,
    offerRate: totalInterviews ? Math.round((totalOffers / totalInterviews) * 100) : 0,
    averageAtsScore,
    resumeScoreTrend: scoredAnalyses.map((item: any, index: number) => ({ name: "V" + (index + 1), score: item.atsScore })),
    bestJobSources: Object.entries(sourceCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    mostMissingSkills: jobSearchHealth.topMissingSkills,
    weeklyApplicationChart: buildWeeklyApplicationChart(applications),
    applicationStatusChart: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
    jobSearchHealth
  };
}
