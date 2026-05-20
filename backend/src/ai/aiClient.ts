import type { ZodSchema } from "zod";
import { env } from "../config/env.js";

type AiProvider = "mock" | "openai" | "gemini";

type AiRuntime = {
  provider: AiProvider;
  model: string;
  timeoutMs: number;
  retryAttempts: number;
};

function resolveRuntime(): AiRuntime {
  const requested = env.AI_PROVIDER.toLowerCase();
  const provider: AiProvider =
    requested === "openai" && env.OPENAI_API_KEY
      ? "openai"
      : requested === "gemini" && env.GEMINI_API_KEY
        ? "gemini"
        : requested === "mock"
          ? "mock"
          : env.OPENAI_API_KEY
            ? "openai"
            : env.GEMINI_API_KEY
              ? "gemini"
              : "mock";

  const model =
    env.AI_MODEL ||
    (provider === "openai" ? "gpt-4o-mini" : provider === "gemini" ? "gemini-1.5-flash" : "mock-career-copilot");

  return {
    provider,
    model,
    timeoutMs: Math.max(env.AI_TIMEOUT_MS, 1_000),
    retryAttempts: Math.max(env.AI_RETRY_ATTEMPTS, 0)
  };
}

export function getAiRuntime() {
  return resolveRuntime();
}

function extractJson(text: string) {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = cleaned.search(/[\[{]/);
  const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  if (start === -1 || end === -1 || end < start) return cleaned;
  return cleaned.slice(start, end + 1);
}

function validateJson<T>(value: unknown, fallback: T, schema?: ZodSchema<T>) {
  if (!schema) return value as T;
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}

async function fetchJsonWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`AI provider returned HTTP ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function withRetry<T>(attempts: number, action: () => Promise<T>) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= attempts; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

async function callOpenAi(prompt: string, runtime: AiRuntime) {
  const data = await fetchJsonWithTimeout(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + env.OPENAI_API_KEY
      },
      body: JSON.stringify({
        model: runtime.model,
        messages: [
          { role: "system", content: "Return only strict JSON. No markdown, comments, or prose." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    },
    runtime.timeoutMs,
  );
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI response did not include JSON content");
  return JSON.parse(extractJson(content));
}

async function callGemini(prompt: string, runtime: AiRuntime) {
  const data = await fetchJsonWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${runtime.model}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
        contents: [{ parts: [{ text: `${prompt}\nReturn only strict JSON.` }] }]
      })
    },
    runtime.timeoutMs,
  );
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini response did not include JSON content");
  return JSON.parse(extractJson(text));
}

export async function callJsonModel<T>(prompt: string, fallback: T, schema?: ZodSchema<T>) {
  const runtime = resolveRuntime();
  if (runtime.provider === "mock") return validateJson(fallback, fallback, schema);

  try {
    const json = await withRetry(runtime.retryAttempts, () =>
      runtime.provider === "openai" ? callOpenAi(prompt, runtime) : callGemini(prompt, runtime),
    );
    return validateJson(json, fallback, schema);
  } catch {
    return validateJson(fallback, fallback, schema);
  }
}
