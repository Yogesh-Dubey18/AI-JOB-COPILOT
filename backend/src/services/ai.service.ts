import OpenAI from "openai";
import { z } from "zod";

export { aiService } from "../ai/ai.service.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

// Strict Zod schema for AI Match Output
export const JobMatchSchema = z.object({
  match_score: z.number().min(0).max(100),
  dealbreakers: z.array(z.string()),
  missing_skills: z.array(z.string()),
  reasoning: z.string(),
  verdict: z.enum(["APPLY", "SKIP"]),
});

export type JobMatchResult = z.infer<typeof JobMatchSchema>;

export async function evaluateJobMatchWithAI(
  masterResume: string,
  jobDescription: string
): Promise<JobMatchResult> {
  const master_resume = masterResume;
  const job_description = jobDescription;

  const prompt = `
    You are an elite technical recruiter and hiring manager for React and Flutter development roles.
    Analyze the Candidate Master Resume against the Job Description.

    MASTER RESUME:
    ${masterResume}

    JOB DESCRIPTION:
    ${jobDescription}

    Instructions:
    1. Calculate a strict technical match score (0-100). Penalize if core tech stack (React, Flutter, TypeScript) doesn't match.
    2. Identify strict dealbreakers (years of experience, visa/location issues).
    3. List missing secondary skills.
    4. Provide verdict: "APPLY" if score >= 75 and no dealbreakers, otherwise "SKIP".

    You MUST output valid JSON strictly conforming to this schema without markdown formatting:
    {
      "match_score": number,
      "dealbreakers": string[],
      "missing_skills": string[],
      "reasoning": string,
      "verdict": "APPLY" | "SKIP"
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response received from AI model.");
    }

    const cleanContent = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsedJson = JSON.parse(cleanContent);

    // Runtime validation using Zod
    const validatedResult = JobMatchSchema.parse(parsedJson);
    return validatedResult;
  } catch (error) {
    console.error("AI Matching Error or Zod Validation Failed:", error);
    // Fallback default safe response so pipeline doesn't crash
    return {
      match_score: 0,
      dealbreakers: ["AI Parsing Error or Invalid Output Format"],
      missing_skills: [],
      reasoning: "Failed to safely parse AI response.",
      verdict: "SKIP",
    };
  }
}