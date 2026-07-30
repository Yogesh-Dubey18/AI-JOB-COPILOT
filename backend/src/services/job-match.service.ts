import { aiService } from "../ai/ai.service.js";
import { ApiError } from "../utils/ApiError.js";
import { createRecord, findOneRecord, findRecordById, findRecords } from "../utils/repository.js";
import { getJob } from "./job.service.js";
import { scoreResumeForRole } from "./ats-scoring.service.js";

/**
 * Compute a deterministic 0-100 location fit score by comparing the
 * candidate's preferred locations (from their Profile) against the
 * job's location and remote type. This never depends on the AI provider
 * being configured, so location fit is always accurate and consistent.
 */
function computeLocationFit(profile: any, job: any): { score: number; reason: string } {
  const preferred: string[] = Array.isArray(profile?.preferredLocations) ? profile.preferredLocations : [];
  const jobLocation = String(job?.location || "").toLowerCase().trim();
  const remoteType = String(job?.remoteType || "").toLowerCase();

  if (preferred.length === 0) {
    return { score: 70, reason: "No location preference set on profile; assuming flexible." };
  }

  if (remoteType.includes("remote")) {
    return { score: 100, reason: "Job is fully remote, matching any location preference." };
  }

  const normalizedPreferred = preferred.map((p) => String(p).toLowerCase().trim());
  const isRemotePreference = normalizedPreferred.some((p) => p.includes("remote"));
  const isDirectMatch = normalizedPreferred.some(
    (p) => p && jobLocation && (jobLocation.includes(p) || p.includes(jobLocation))
  );

  if (isDirectMatch) {
    return { score: 100, reason: `Job location matches one of your preferred locations (${preferred.join(", ")}).` };
  }
  if (isRemotePreference && remoteType.includes("hybrid")) {
    return { score: 55, reason: "You prefer remote work; this role is hybrid, which is a partial match." };
  }
  return { score: 30, reason: `Job location (${job?.location || "unspecified"}) does not match your preferred locations (${preferred.join(", ")}).` };
}

/**
 * Compute a deterministic 0-100 salary fit score by comparing the
 * candidate's expected salary (from their Profile) against the job's
 * salary range, if both are known.
 */
function computeSalaryFit(profile: any, job: any): { score: number; reason: string } {
  const expected = Number(profile?.expectedSalary) || 0;
  const min = Number(job?.salaryMin) || 0;
  const max = Number(job?.salaryMax) || 0;

  if (!expected) {
    return { score: 70, reason: "No expected salary set on profile; assuming this is negotiable." };
  }
  if (!min && !max) {
    return { score: 60, reason: "Job does not disclose a salary range; fit cannot be fully verified." };
  }

  const effectiveMax = max || min;
  const effectiveMin = min || max;

  if (expected >= effectiveMin && expected <= effectiveMax) {
    return { score: 100, reason: "Job's disclosed salary range covers your expected salary." };
  }
  if (expected < effectiveMin) {
    return { score: 85, reason: "Job's minimum salary is above your expectation, which is favorable." };
  }
  // expected > effectiveMax
  const overBy = ((expected - effectiveMax) / effectiveMax) * 100;
  if (overBy <= 15) {
    return { score: 55, reason: "Your expected salary is slightly above this job's disclosed maximum." };
  }
  return { score: 25, reason: "Your expected salary is significantly above this job's disclosed range." };
}

/**
 * Compute a deterministic 0-100 experience-level fit score by comparing
 * the candidate's profile experience level/years against the job's
 * stated experience requirement text.
 */
function computeExperienceFit(profile: any, job: any): { score: number; reason: string } {
  const level = String(profile?.experienceLevel || "fresher").toLowerCase();
  const years = Number(profile?.totalExperienceYears) || 0;
  const requiredText = String(job?.experienceRequired || "").toLowerCase();

  if (!requiredText) {
    return { score: 70, reason: "Job did not specify an experience requirement." };
  }

  const requiresSenior = /senior|lead|principal|\b[5-9]\+?\s*years?\b|10\+?\s*years?/i.test(requiredText);
  const requiresMid = /mid[-\s]?level|\b[2-4]\+?\s*years?\b/i.test(requiredText);
  const requiresFresherOk = /fresher|entry[-\s]?level|0[-\s]?1\s*years?|graduate/i.test(requiredText);

  if (requiresFresherOk && (level === "fresher" || years <= 1)) {
    return { score: 100, reason: "Job explicitly welcomes freshers/entry-level candidates, matching your profile." };
  }
  if (requiresSenior && (level === "fresher" || years < 3)) {
    return { score: 25, reason: "This role expects senior-level experience, which is above your current profile." };
  }
  if (requiresMid && level === "fresher" && years < 1) {
    return { score: 45, reason: "This role expects some prior experience; your profile shows you're a fresher." };
  }
  return { score: 75, reason: "Your experience level reasonably aligns with this role's requirements." };
}

export async function matchJob(userId: string, jobId: string, resumeId?: string) {
  const job = await getJob(jobId);
  const resumes = resumeId ? [await findRecordById("resumes", resumeId)] : await findRecords("resumes", { userId }, { limit: 1, sort: { createdAt: -1 } });
  const resume = resumes[0];
  if (!resume) throw new ApiError(400, "Upload a resume before matching jobs");

  // Fetch the candidate's profile so location/salary/experience preferences
  // genuinely influence the match, instead of being silently ignored.
  const profile = await findOneRecord("profiles", { userId });

  const locationFit = computeLocationFit(profile, job);
  const salaryFit = computeSalaryFit(profile, job);
  const experienceFit = computeExperienceFit(profile, job);

  const result = await aiService.matchJob(userId, {
    job,
    resume,
    profile: profile ? {
      targetRoles: profile.targetRoles,
      preferredLocations: profile.preferredLocations,
      preferredJobTypes: profile.preferredJobTypes,
      expectedSalary: profile.expectedSalary,
      experienceLevel: profile.experienceLevel,
      totalExperienceYears: profile.totalExperienceYears,
      noticePeriod: profile.noticePeriod
    } : null,
    computedFit: { locationFit, salaryFit, experienceFit },
    formula: { skill: 35, project: 15, experience: 15, location: 15, salary: 10, keyword: 10 }
  });

  // Blend the AI's skill/keyword-based matchScore with the deterministic
  // location/salary/experience fit scores computed above, so profile
  // preferences always have real, guaranteed weight in the final score -
  // even if the AI response ignores them or falls back to a default.
  const skillWeight = 0.6;
  const locationWeight = 0.15;
  const salaryWeight = 0.1;
  const experienceWeight = 0.15;

  const blendedMatchScore = Math.round(
    (Number(result.matchScore) || 0) * skillWeight +
    locationFit.score * locationWeight +
    salaryFit.score * salaryWeight +
    experienceFit.score * experienceWeight
  );

  // Retrieve or compute ATS score
  const analyses = await findRecords("resumeAnalyses", { userId, resumeId: resume._id }, { limit: 1, sort: { createdAt: -1 } });
  const atsScore = analyses[0]?.atsScore || (await scoreResumeForRole(resume, job.title)).atsScore;

  // Compute composite apply readiness score
  const hasApplyUrl = Boolean(job.applyUrl);
  const applyReadinessScore = Math.min(100, Math.max(0, Math.round(
    (blendedMatchScore * 0.5) + (atsScore * 0.4) + (hasApplyUrl ? 10 : 0)
  )));

  return createRecord("jobMatches", {
    userId,
    jobId,
    resumeId: resume._id,
    ...result,
    matchScore: blendedMatchScore,
    aiSkillMatchScore: result.matchScore,
    locationFit,
    salaryFit,
    experienceFit,
    applyReadinessScore
  });
}

