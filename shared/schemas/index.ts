import { z } from "zod";

export const emailSchema = z.string().email();
export const authRegisterSchema = z.object({
  fullName: z.string().min(2),
  email: emailSchema,
  password: z.string().min(8),
  phone: z.string().optional()
});

export const authLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8)
});

export const profileSchema = z.object({
  headline: z.string().optional(),
  currentRole: z.string().optional(),
  targetRoles: z.array(z.string()).default([]),
  experienceLevel: z.enum(["fresher", "junior", "mid", "senior"]).default("fresher"),
  totalExperienceYears: z.coerce.number().min(0).default(0),
  skills: z.array(z.string()).default([]),
  softSkills: z.array(z.string()).default([]),
  preferredLocations: z.array(z.string()).default([]),
  preferredJobTypes: z.array(z.string()).default([]),
  expectedSalary: z.coerce.number().optional(),
  noticePeriod: z.string().optional(),
  githubUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
  education: z.array(z.object({ degree: z.string().optional(), college: z.string().optional(), graduationYear: z.coerce.number().optional() })).default([])
});
