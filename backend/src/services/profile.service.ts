import { ApiError } from "../utils/ApiError.js";
import { createRecord, findOneRecord, updateRecord } from "../utils/repository.js";

export function computeProfileCompleteness(profile: any) {
  const checks = [
    profile.headline,
    profile.currentRole,
    profile.targetRoles?.length,
    profile.experienceLevel,
    profile.skills?.length,
    profile.education?.length,
    profile.preferredLocations?.length,
    profile.githubUrl,
    profile.linkedinUrl,
    profile.portfolioUrl
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export async function getProfile(userId: string) {
  let profile = await findOneRecord("profiles", { userId });
  if (!profile) {
    profile = await createRecord("profiles", {
      userId,
      targetRoles: [],
      skills: [],
      softSkills: [],
      preferredLocations: [],
      preferredJobTypes: [],
      education: [],
      profileCompletenessScore: 0
    });
  }
  return profile;
}

export async function updateProfile(userId: string, input: any) {
  const profile = await getProfile(userId);
  const next = { ...profile, ...input };
  next.profileCompletenessScore = computeProfileCompleteness(next);
  return updateRecord("profiles", String(profile._id), next);
}

export async function addSkill(userId: string, skill: string) {
  const profile = await getProfile(userId);
  const skills = Array.from(new Set([...(profile.skills || []), skill]));
  return updateProfile(userId, { skills });
}

export async function removeSkill(userId: string, skill: string) {
  const profile = await getProfile(userId);
  if (!profile) throw new ApiError(404, "Profile not found");
  return updateProfile(userId, { skills: (profile.skills || []).filter((item: string) => item.toLowerCase() !== skill.toLowerCase()) });
}
