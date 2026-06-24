import { findRecords, countRecords } from "../utils/repository.js";
import { getJobSearchIntelligence } from "./job-search-intelligence.service.js";

export async function getAnalyticsOverview(userId: string) {
  const [applications, analyses, jobSearchHealth, totalDiscovered] = await Promise.all([
    findRecords("applications", { userId }),
    findRecords("resumeAnalyses", { userId }),
    getJobSearchIntelligence(userId),
    countRecords("jobs")
  ]);
  const totalApplied = applications.filter((app: any) => app.status !== "Saved").length;
  const totalInterviews = applications.filter((app: any) => /Scheduled|Round|Offer/i.test(app.status)).length;
  const totalRejected = applications.filter((app: any) => app.status === "Rejected").length;
  const totalOffers = applications.filter((app: any) => app.status === "Offer").length;
  const averageAtsScore = analyses.length ? Math.round(analyses.reduce((sum: number, item: any) => sum + (item.atsScore || 0), 0) / analyses.length) : 82;
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
    totalShortlisted: applications.filter((app: any) => ["Interview Scheduled"].includes(app.status)).length,
    totalInterviews,
    totalRejected,
    totalOffers,
    responseRate: totalApplied ? Math.round((totalInterviews / totalApplied) * 100) : 0,
    interviewRate: totalApplied ? Math.round((totalInterviews / totalApplied) * 100) : 0,
    offerRate: totalInterviews ? Math.round((totalOffers / totalInterviews) * 100) : 0,
    averageAtsScore,
    resumeScoreTrend: analyses.map((item: any, index: number) => ({ name: "V" + (index + 1), score: item.atsScore })),
    bestJobSources: Object.entries(sourceCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    mostMissingSkills: jobSearchHealth.topMissingSkills,
    weeklyApplicationChart: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((name, index) => ({ name, applications: index + 1 })),
    applicationStatusChart: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
    jobSearchHealth
  };
}
