import { z } from "zod";

export const createCompanyResearchSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(100),
  industry: z.string().trim().max(100).optional(),
  techStack: z.array(z.string().trim().max(100)).optional().default([]),
  culture: z.string().trim().max(2000).optional(),
  glassdoorRating: z.coerce.number().min(0).max(5).optional(),
  salaryRangeMin: z.coerce.number().nonnegative().optional(),
  salaryRangeMax: z.coerce.number().nonnegative().optional(),
  careerPageUrl: z.string().trim().max(500).optional(),
  interviewProcess: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(2000).optional()
});
