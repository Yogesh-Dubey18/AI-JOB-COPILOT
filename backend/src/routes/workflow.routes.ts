import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { countRecords, findRecords } from "../utils/repository.js";
import { computeNextBestActions } from "../services/next-best-action.service.js";
import { summarizeApplications } from "../services/application-intelligence.service.js";

const router = Router();
router.use(requireAuth);

/**
 * GET /api/workflow/next-best-actions
 * Returns agent cards, next-best-actions, and overall workflow progress
 * for the authenticated user based on their real data counts.
 * No AI required. Deterministic rule-based engine.
 */
router.get(
  "/next-best-actions",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    const [resumes, applications, interviews, companyResearches, answerVaultEntries, portfolios, profileList] = await Promise.all([
      findRecords("resumes", { userId }),
      findRecords("applications", { userId }),
      findRecords("interviews", { userId }),
      findRecords("companyResearch", { userId }),
      findRecords("answerVault", { userId }),
      findRecords("portfolios", { userId }),
      findRecords("profiles", { userId })
    ]);
    const profile = profileList[0] || null;

    const summary = summarizeApplications(applications);
    const hasBaseResume = resumes.some((r: any) => r.isBaseResume);
    const savedCount = applications.filter((a: any) => a.status === "Saved").length;
    const appliedCount = applications.filter((a: any) => a.status !== "Saved").length;
    const offerCount = applications.filter((a: any) => ["Offer", "Selected"].includes(a.status)).length;
    const kitsGenerated = applications.filter((a: any) => a.applicationKitId || a.resumeVersionId).length;
    const portfolioPublished = portfolios.some((p: any) => p.isPublished);
    const profileSkillsCount = Array.isArray(profile?.skills) ? profile.skills.length : 0;
    const profileRolesCount = Array.isArray(profile?.targetRoles) ? profile.targetRoles.length : 0;
    const hasEmail = Boolean(profile?.email || req.user!.email);

    const result = computeNextBestActions({
      resumeCount: resumes.length,
      hasBaseResume,
      applicationCount: applications.length,
      savedCount,
      appliedCount,
      interviewCount: interviews.length,
      offerCount,
      answerVaultCount: answerVaultEntries.length,
      profileSkillsCount,
      profileRolesCount,
      companyResearchCount: companyResearches.length,
      portfolioPublished,
      kitsGenerated,
      followUpsDue: summary.followUpsDue,
      hasEmail
    });

    res.json({ success: true, data: result });
  })
);

export default router;
