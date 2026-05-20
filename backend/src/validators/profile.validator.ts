import { z } from "zod";

const list = z.preprocess((value) => {
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return value;
}, z.array(z.string()).default([]));

export const profileUpdateSchema = z.object({
  headline: z.string().optional(),
  currentRole: z.string().optional(),
  targetRoles: list,
  experienceLevel: z.enum(["fresher", "junior", "mid", "senior"]).default("fresher"),
  totalExperienceYears: z.coerce.number().min(0).default(0),
  skills: list,
  softSkills: list,
  preferredLocations: list,
  preferredJobTypes: list,
  expectedSalary: z.coerce.number().optional(),
  noticePeriod: z.string().optional(),
  githubUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
  education: z.array(z.object({ degree: z.string().optional(), college: z.string().optional(), graduationYear: z.coerce.number().optional() })).default([])
});

export const skillSchema = z.object({ skill: z.string().min(1) });
