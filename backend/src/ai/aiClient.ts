import type { ZodSchema } from "zod";
import { env } from "../config/env.js";
import { estimateTokens } from "./guardrails.js";
import { AIRequestModel } from "../models/AIRequest.js";

function estimateCostUsd(provider: string, model: string, inputTokens: number, outputTokens: number): number {
  if (provider === "openai") {
    if (model.includes("gpt-4o-mini")) {
      return (inputTokens * 0.15 + outputTokens * 0.60) / 1_000_000;
    }
    return (inputTokens * 2.50 + outputTokens * 10.00) / 1_000_000;
  }
  if (provider === "gemini") {
    return (inputTokens * 0.075 + outputTokens * 0.30) / 1_000_000;
  }
  return 0;
}

export async function getDailyCostUsd(): Promise<number> {
  try {
    if (!AIRequestModel) return 0;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const requests = await AIRequestModel.find({
      createdAt: { $gte: startOfToday },
      status: "success"
    }).select("provider model inputTokens outputTokens").lean();

    let totalCost = 0;
    for (const r of requests) {
      const rawProvider = (r.provider || "").toLowerCase();
      const rawModel = (r.model || "").toLowerCase();
      const provider = rawProvider || (rawModel.includes("openai") ? "openai" : rawModel.includes("gemini") ? "gemini" : "");
      totalCost += estimateCostUsd(provider, rawModel, r.inputTokens || 0, r.outputTokens || 0);
    }
    return totalCost;
  } catch (error) {
    console.error("Error calculating daily AI cost:", error);
    return 0;
  }
}

export async function checkDailyBudgetLimit(): Promise<{ allowed: boolean; costUsd: number; limitUsd: number }> {
  const limitUsd = Number(process.env.AI_DAILY_BUDGET_USD || "10.00");
  const costUsd = await getDailyCostUsd();
  return {
    allowed: costUsd < limitUsd,
    costUsd,
    limitUsd
  };
}

export type AiProvider = "mock" | "openai" | "gemini" | "groq";

type AiRuntime = {
  provider: AiProvider;
  model: string;
  timeoutMs: number;
  retryAttempts: number;
};

export type AiCallStatus = "success" | "mock" | "fallback" | "schema_fallback";

export type AiCallMeta = {
  provider: AiProvider;
  model: string;
  status: AiCallStatus;
  fallbackUsed: boolean;
  validationPassed: boolean;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  error?: string;
};

function resolveRuntime(): AiRuntime {
  const requested = env.AI_PROVIDER.toLowerCase();
  const provider: AiProvider =
    requested === "openai" && env.OPENAI_API_KEY
      ? "openai"
      : requested === "gemini" && env.GEMINI_API_KEY
        ? "gemini"
        : requested === "groq" && env.GROQ_API_KEY
          ? "groq"
          : requested === "mock"
            ? "mock"
            : env.OPENAI_API_KEY
              ? "openai"
              : env.GEMINI_API_KEY
                ? "gemini"
                : env.GROQ_API_KEY
                  ? "groq"
                  : "mock";

  const model =
    env.AI_MODEL ||
    (provider === "openai" ? "gpt-4o-mini" 
    : provider === "gemini" ? "gemini-1.5-flash"
    : provider === "groq" ? "llama3-8b-8192"
    : "mock-career-copilot");

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
  if (!schema) return { data: value as T, validationPassed: true };
  const parsed = schema.safeParse(value);
  return parsed.success ? { data: parsed.data, validationPassed: true } : { data: fallback, validationPassed: false };
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

async function callGroq(prompt: string, runtime: AiRuntime) {
  const data = await fetchJsonWithTimeout(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + env.GROQ_API_KEY
      },
      body: JSON.stringify({
        model: runtime.model,
        messages: [
          { role: "system", content: "Return only strict JSON. No markdown, comments, or prose." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      })
    },
    runtime.timeoutMs
  );
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq response did not include content");
  return JSON.parse(extractJson(content));
}

export async function callJsonModelWithMeta<T>(prompt: string, fallback: T, schema?: ZodSchema<T>) {
  const runtime = resolveRuntime();
  const startedAt = Date.now();
  const inputTokens = estimateTokens(prompt);

  if (runtime.provider !== "mock") {
    const budget = await checkDailyBudgetLimit();
    if (!budget.allowed) {
      console.warn(`Daily AI budget limit exceeded ($${budget.costUsd.toFixed(4)} / $${budget.limitUsd.toFixed(2)}). Falling back to mock.`);
      const validated = validateJson(fallback, fallback, schema);
      return {
        data: validated.data,
        meta: {
          provider: "mock" as const,
          model: runtime.model,
          status: "fallback" as const,
          fallbackUsed: true,
          validationPassed: validated.validationPassed,
          inputTokens,
          outputTokens: estimateTokens(JSON.stringify(validated.data)),
          latencyMs: Date.now() - startedAt,
          error: `Daily budget exceeded: $${budget.costUsd.toFixed(4)}`
        }
      };
    }
  }

  if (runtime.provider === "mock") {
    const validated = validateJson(fallback, fallback, schema);
    return {
      data: validated.data,
      meta: {
        provider: runtime.provider,
        model: runtime.model,
        status: "mock" as const,
        fallbackUsed: true,
        validationPassed: validated.validationPassed,
        inputTokens,
        outputTokens: estimateTokens(JSON.stringify(validated.data)),
        latencyMs: Date.now() - startedAt
      }
    };
  }

  try {
    const json = await withRetry(runtime.retryAttempts, () =>
      runtime.provider === "openai" ? callOpenAi(prompt, runtime) 
      : runtime.provider === "groq" ? callGroq(prompt, runtime)
      : callGemini(prompt, runtime)
    );
    const validated = validateJson(json, fallback, schema);
    return {
      data: validated.data,
      meta: {
        provider: runtime.provider,
        model: runtime.model,
        status: validated.validationPassed ? "success" as const : "schema_fallback" as const,
        fallbackUsed: !validated.validationPassed,
        validationPassed: validated.validationPassed,
        inputTokens,
        outputTokens: estimateTokens(JSON.stringify(validated.data)),
        latencyMs: Date.now() - startedAt,
        error: validated.validationPassed ? undefined : "AI response failed output schema validation"
      }
    };
  } catch (error) {
    console.error("🔴 AI_ERROR:", runtime.provider, runtime.model, error instanceof Error ? error.message : String(error));
    const validated = validateJson(fallback, fallback, schema);
    return {
      data: validated.data,
      meta: {
        provider: runtime.provider,
        model: runtime.model,
        status: "fallback" as const,
        fallbackUsed: true,
        validationPassed: validated.validationPassed,
        inputTokens,
        outputTokens: estimateTokens(JSON.stringify(validated.data)),
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : "Unknown AI provider error"
      }
    };
  }
}

export async function callJsonModel<T>(prompt: string, fallback: T, schema?: ZodSchema<T>) {
  const result = await callJsonModelWithMeta(prompt, fallback, schema);
  return result.data;
}

/**
 * Generates a semantic embedding vector for the given text using OpenAI's
 * text-embedding-3-small model. This powers semantic (meaning-based) job
 * matching in addition to plain keyword overlap - so e.g. "financial
 * modeling" and "financial analysis" are recognized as related even
 * without an exact keyword match.
 *
 * Returns null (never throws) when:
 * - No OPENAI_API_KEY is configured (feature gracefully degrades to
 *   keyword-only matching elsewhere in the app)
 * - The embedding request fails or times out for any reason
 *
 * Callers MUST treat a null result as "semantic matching unavailable for
 * this call" and fall back to their existing keyword-based logic - this
 * is intentional graceful degradation, not an error to surface to users.
 */
export async function getEmbedding(text: string): Promise<number[] | null> {
  if (!env.OPENAI_API_KEY) return null;
  const trimmed = (text || "").trim();
  if (!trimmed) return null;

  try {
    const data = await fetchJsonWithTimeout(
      "https://api.openai.com/v1/embeddings",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + env.OPENAI_API_KEY
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: trimmed.slice(0, 8000)
        })
      },
      Math.max(env.AI_TIMEOUT_MS, 8_000)
    );
    const vector = data?.data?.[0]?.embedding;
    return Array.isArray(vector) ? vector : null;
  } catch {
    return null;
  }
}

