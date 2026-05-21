import { z } from "zod";

export const passwordSchema = z.string()
  .min(8)
  .max(128)
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[0-9]/, "Password must include a number");

export const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email().transform((value) => value.toLowerCase().trim()),
  password: passwordSchema,
  phone: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase().trim()),
  password: z.string().min(8).max(128)
});

export const forgotPasswordSchema = z.object({ email: z.string().email() });
export const resetPasswordSchema = z.object({ token: z.string().min(8), password: passwordSchema });
