import { findOneRecord, findRecords } from "../utils/repository.js";

const activeStatuses = ["Saved", "Applied", "Interview Scheduled", "Technical Round", "HR Round", "Offer"];
const interviewStatuses = ["Interview Scheduled", "Technical Round", "HR Round", "Offer"];

function toDate(value: any) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function aggregateTerms(rows: any[], fields: string[]) {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    fields.forEach((field) => {
      const values = field.split(".").reduce((acc: any, part) => acc?.[part], row);
      const items = Array.isArray(values) ? values : typeof values === "string" ? values.split(",") : [];
      items.map((item: any) => String(item).trim()).filter(Boolean).forEach((item) => counts.set(item, (counts.get(item) || 0) + 1));
    });
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));
}

function level(score: number) {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Improving";
  if (score >= 40) return "Needs focus";
  return "At risk";
}

export async function getJobSearchIntelligence(userId: string) {
  const [profile, applications, analyses, matches, interviews] = await Promise.all([
    findOneRecord("profiles", { userId }),
    findRecords("applications", { userId }),
    findRecords("resumeAnalyses", { userId }, { sort: { createdAt: -1 } }),
    findRecords("jobMatches", { userId }),
    findRecords("interviews", { userId })
  ]);
  const now = new Date();
  const last7 = daysAgo(7);
  const last30 = daysAgo(30);
  const applied = applications.filter((app: any) => app.status !== "Saved");
  const active = applications.filter((app: any) => activeStatuses.includes(app.status));
  const interviewCount = applications.filter((app: any) => interviewStatuses.includes(app.status)).length + interviews.length;
  const offers = applications.filter((app: any) => ["Offer", "Selected"].includes(app.status)).length;
  const rejected = applications.filter((app: any) => app.status === "Rejected").length;
  const appliedLast7 = applied.filter((app: any) => (toDate(app.appliedDate) || toDate(app.createdAt) || now) >= last7).length;
  const appliedLast30 = applied.filter((app: any) => (toDate(app.appliedDate) || toDate(app.createdAt) || now) >= last30).length;
  const followUpsDue = active.filter((app: any) => {
    const due = toDate(app.nextFollowUpDate);
    return due && due <= now;
  });
  const staleApplications = active.filter((app: any) => {
    const lastActivity = toDate(app.lastActivityAt) || toDate(app.updatedAt) || toDate(app.createdAt);
    return lastActivity && lastActivity < daysAgo(10);
  });
  const latestAts = analyses[0]?.atsScore || 0;
  const profileScore = profile?.profileCompletenessScore || 0;
  const responseRate = applied.length ? Math.round((interviewCount / applied.length) * 100) : 0;
  const offerRate = interviewCount ? Math.round((offers / interviewCount) * 100) : 0;
  const rejectionRate = applied.length ? Math.round((rejected / applied.length) * 100) : 0;
  const topMissingSkills = aggregateTerms([...matches, ...analyses], ["missingSkills", "missingKeywords"]);
  const scoreBreakdown = {
    profile: clampScore(profileScore),
    resume: clampScore(latestAts),
    applicationVelocity: clampScore((appliedLast7 / 10) * 100),
    followUpHygiene: clampScore(100 - Math.min(100, followUpsDue.length * 20 + staleApplications.length * 10)),
    interviewConversion: clampScore(responseRate * 2),
    skillFocus: clampScore(100 - Math.min(80, topMissingSkills.length * 10))
  };
  const healthScore = clampScore(
    scoreBreakdown.profile * 0.18 +
    scoreBreakdown.resume * 0.2 +
    scoreBreakdown.applicationVelocity * 0.18 +
    scoreBreakdown.followUpHygiene * 0.18 +
    scoreBreakdown.interviewConversion * 0.16 +
    scoreBreakdown.skillFocus * 0.1
  );
  const bestNextActions = [
    profileScore < 80 ? "Complete the remaining profile fields for better matching." : "",
    latestAts < 80 ? "Improve or tailor the latest resume before the next batch." : "",
    appliedLast7 < 5 ? "Submit a focused batch of 5 to 10 high-match applications this week." : "",
    followUpsDue.length ? `Send ${followUpsDue.length} overdue follow-up message${followUpsDue.length > 1 ? "s" : ""}.` : "",
    topMissingSkills.length ? `Work on ${topMissingSkills.slice(0, 3).map((skill) => skill.name).join(", ")}.` : "",
    responseRate < 15 && applied.length >= 10 ? "Tighten targeting: prioritize higher-match roles and stronger referral paths." : ""
  ].filter(Boolean);
  const riskFlags = [
    rejectionRate > 50 ? "High rejection rate compared with current application volume." : "",
    staleApplications.length > 3 ? "Several active applications have no recent activity." : "",
    !analyses.length ? "No saved resume analysis found." : "",
    !applications.length ? "No applications tracked yet." : ""
  ].filter(Boolean);
  return {
    healthScore,
    healthLevel: level(healthScore),
    scoreBreakdown,
    funnel: {
      saved: applications.filter((app: any) => app.status === "Saved").length,
      applied: applied.length,
      interviews: interviewCount,
      offers,
      rejected
    },
    velocity: {
      appliedLast7,
      appliedLast30,
      weeklyTarget: 10,
      progressToWeeklyTarget: clampScore((appliedLast7 / 10) * 100)
    },
    conversion: {
      responseRate,
      interviewRate: responseRate,
      offerRate,
      rejectionRate
    },
    followUpsDue: followUpsDue.map((app: any) => ({ id: String(app._id), company: app.company, role: app.role, nextFollowUpDate: app.nextFollowUpDate })),
    staleApplications: staleApplications.map((app: any) => ({ id: String(app._id), company: app.company, role: app.role, status: app.status })),
    topMissingSkills,
    bestNextActions: bestNextActions.length ? bestNextActions : ["Keep applying to well-matched roles and track each next step."],
    riskFlags,
    summary: `Job-search health is ${level(healthScore).toLowerCase()} at ${healthScore}/100.`
  };
}
