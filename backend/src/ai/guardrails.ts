import { env } from "../config/env.js";

const SECRET_PATTERNS = [
  { flag: "openai_key_redacted", pattern: /sk-[A-Za-z0-9_-]{16,}/g },
  { flag: "google_key_redacted", pattern: /AIza[0-9A-Za-z_-]{20,}/g },
  { flag: "mongo_uri_redacted", pattern: /mongodb(?:\+srv)?:\/\/[^\s"']+/gi },
  { flag: "jwt_redacted", pattern: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g },
  { flag: "private_key_redacted", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g }
];

export const AI_SAFETY_RULES = [
  "Do not invent experience, employers, degrees, dates, certifications, salaries, projects, or skills.",
  "Generated applications, emails, messages, and cover letters must be drafts for user review only.",
  "Never claim that an application was submitted or a recruiter was contacted.",
  "Do not request, reveal, or repeat API keys, passwords, private keys, tokens, or secrets.",
  "If data is missing, say what is missing and provide a truthful improvement path.",
  "Return only valid JSON matching the requested schema."
];

export type GuardrailResult = {
  prompt: string;
  safetyFlags: string[];
  originalChars: number;
  finalChars: number;
};

export function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function redactSensitiveText(value: string) {
  let text = value;
  const flags = new Set<string>();
  for (const { flag, pattern } of SECRET_PATTERNS) {
    if (pattern.test(text)) {
      flags.add(flag);
      text = text.replace(pattern, "[REDACTED_SECRET]");
    }
    pattern.lastIndex = 0;
  }
  return { text, flags: Array.from(flags) };
}

export function buildGuardedPrompt(feature: string, rawPrompt: string): GuardrailResult {
  const originalChars = rawPrompt.length;
  const redacted = redactSensitiveText(rawPrompt);
  const safetyFlags = [...redacted.flags];
  const maxChars = Math.max(env.AI_MAX_PROMPT_CHARS, 4_000);
  let safePrompt = redacted.text;
  if (safePrompt.length > maxChars) {
    safePrompt = safePrompt.slice(0, maxChars);
    safetyFlags.push("prompt_truncated");
  }

  const prompt = [
    "You are AI Job Copilot, a job-seeker focused AI career assistant.",
    `Feature: ${feature}.`,
    "Safety rules:",
    ...AI_SAFETY_RULES.map((rule) => `- ${rule}`),
    "User and product context:",
    safePrompt
  ].join("\n");

  return {
    prompt,
    safetyFlags,
    originalChars,
    finalChars: prompt.length
  };
}

export function getAiSafetyStatus() {
  return {
    mode: env.AI_SAFETY_MODE,
    maxPromptChars: Math.max(env.AI_MAX_PROMPT_CHARS, 4_000),
    rules: AI_SAFETY_RULES
  };
}
