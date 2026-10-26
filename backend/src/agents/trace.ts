import { AsyncLocalStorage } from "node:async_hooks";
import type { NextFunction, Request, Response } from "express";

/**
 * Request-scoped record of every agent invocation made while serving one
 * HTTP request. Lets the API tell the client, truthfully, whether a result
 * came from a live model or from a deterministic, input-grounded fallback.
 */
export type AgentMode = "ai" | "fallback";

export type AgentTraceEntry = {
  agent: string;
  mode: AgentMode;
  provider: string;
  reason?: string;
  validationPassed: boolean;
  latencyMs: number;
};

type TraceStore = { entries: AgentTraceEntry[] };

const storage = new AsyncLocalStorage<TraceStore>();

export function recordAgentRun(entry: AgentTraceEntry) {
  storage.getStore()?.entries.push(entry);
}

export function getAgentTrace(): AgentTraceEntry[] {
  return storage.getStore()?.entries ?? [];
}

/** Runs `fn` with an isolated trace store (used by tests and background jobs). */
export function withAgentTrace<T>(fn: () => T): T {
  return storage.run({ entries: [] }, fn);
}

export function summarizeTrace(entries: AgentTraceEntry[]) {
  if (!entries.length) return null;
  const fallbackAgents = Array.from(new Set(entries.filter((e) => e.mode === "fallback").map((e) => e.agent)));
  return {
    mode: fallbackAgents.length ? ("fallback" as const) : ("ai" as const),
    agents: Array.from(new Set(entries.map((e) => e.agent))),
    fallbackAgents
  };
}

/**
 * Express middleware: opens a trace store for the request and, just before
 * the JSON body is written, exposes the outcome via `X-AI-Mode` /
 * `X-AI-Agents` headers. Headers only - response bodies are unchanged so
 * existing clients keep working.
 */
export function agentTraceMiddleware(_req: Request, res: Response, next: NextFunction) {
  storage.run({ entries: [] }, () => {
    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      const summary = summarizeTrace(getAgentTrace());
      if (summary && !res.headersSent) {
        res.setHeader("X-AI-Mode", summary.mode);
        res.setHeader("X-AI-Agents", summary.agents.join(","));
        if (summary.fallbackAgents.length) res.setHeader("X-AI-Fallback-Agents", summary.fallbackAgents.join(","));
      }
      return originalJson(body);
    }) as Response["json"];
    next();
  });
}
