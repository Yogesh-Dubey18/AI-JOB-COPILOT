import { z } from "zod";

export const feedbackTypeSchema = z.enum(["bug", "feature", "ux", "content", "performance", "security", "other"]);
export const feedbackStatusSchema = z.enum(["open", "in_review", "planned", "in_progress", "resolved", "closed"]);
export const feedbackPrioritySchema = z.enum(["low", "medium", "high"]);

export const createFeedbackSchema = z.object({
  type: feedbackTypeSchema.default("other"),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  message: z.string().trim().min(10, "Feedback must be at least 10 characters").max(2500),
  page: z.string().trim().max(200).optional(),
  source: z.string().trim().max(80).default("in_app"),
  contactEmail: z.string().email().optional().or(z.literal(""))
});

export const updateFeedbackSchema = z.object({
  status: feedbackStatusSchema.optional(),
  priority: feedbackPrioritySchema.optional(),
  releaseTarget: z.string().trim().max(80).optional(),
  adminNotes: z.string().trim().max(2000).optional(),
  issueUrl: z.string().url().optional().or(z.literal(""))
});
