/** Window event fired after each API response that involved an AI agent. */
export const AI_MODE_EVENT = "ajc:ai-mode";
export type AiModeDetail = { mode: "ai" | "fallback"; agents: string[]; fallbackAgents: string[] };

/** Broadcasts whether the backend served a result from a live model or a rule-based fallback (X-AI-Mode header). */
export function announceAiMode(headers: Headers) {
  const mode = headers.get("x-ai-mode");
  if (typeof window === "undefined" || (mode !== "ai" && mode !== "fallback")) return;
  const split = (value: string | null) => (value ? value.split(",").map((item) => item.trim()).filter(Boolean) : []);
  const detail: AiModeDetail = { mode, agents: split(headers.get("x-ai-agents")), fallbackAgents: split(headers.get("x-ai-fallback-agents")) };
  window.dispatchEvent(new CustomEvent<AiModeDetail>(AI_MODE_EVENT, { detail }));
}
