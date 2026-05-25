import { z } from "zod";

export const createCareerVaultSchema = z.object({
  type: z.enum(["experience", "achievement", "education", "project", "certification", "skill"]),
  title: z.string().trim().min(1, "Title is required").max(200),
  organisation: z.string().trim().max(200).optional(),
  startDate: z.string().trim().max(50).optional(),
  endDate: z.string().trim().max(50).optional(),
  description: z.string().trim().max(5000).optional(),
  impact: z.string().trim().max(2000).optional(),
  skills: z.array(z.string().trim().max(100)).optional().default([])
});
