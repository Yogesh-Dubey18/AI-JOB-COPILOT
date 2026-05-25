import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export const registerPasswordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must not exceed 128 characters")
  .regex(/[A-Z]/, "Password must include at least one uppercase letter")
  .regex(/[a-z]/, "Password must include at least one lowercase letter")
  .regex(/[0-9]/, "Password must include at least one number");

export const registerSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  password: registerPasswordSchema,
  phone: z.string().optional()
});


export const feedbackSchema = z.object({
  type: z.enum(["bug", "feature", "ux", "content", "performance", "security", "other"]),
  rating: z.number().int().min(1).max(5).optional(),
  message: z.string().trim().min(10, "Share at least 10 characters").max(2500),
  page: z.string().trim().max(200).optional(),
  contactEmail: z.string().email("Enter a valid email").optional().or(z.literal(""))
});
