import { z } from "zod";

export const createAnswerVaultSchema = z.object({
  question: z.string().trim().min(1, "Question is required").max(1000),
  answer: z.string().trim().min(1, "Answer is required").max(10000),
  category: z.string().trim().max(100).optional(),
  tags: z.array(z.string().trim().max(100)).optional().default([])
});
