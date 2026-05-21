import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export const registerSchema = loginSchema.extend({
  fullName: z.string().min(2, "Enter your full name"),
  phone: z.string().optional()
});

export const feedbackSchema = z.object({
  type: z.enum(["bug", "feature", "ux", "content", "performance", "security", "other"]),
  rating: z.number().int().min(1).max(5).optional(),
  message: z.string().trim().min(10, "Share at least 10 characters").max(2500),
  page: z.string().trim().max(200).optional(),
  contactEmail: z.string().email("Enter a valid email").optional().or(z.literal(""))
});
