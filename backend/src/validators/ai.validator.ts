import { z } from "zod";
import { env } from "../config/env.js";

export const aiContextSchema = z.record(z.any()).superRefine((value, ctx) => {
  const payloadSize = JSON.stringify(value).length;
  const maxPayloadSize = Math.max(env.AI_MAX_PROMPT_CHARS + 5_000, 10_000);
  if (payloadSize > maxPayloadSize) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `AI request payload is too large. Keep it under ${maxPayloadSize} characters.`
    });
  }
});
