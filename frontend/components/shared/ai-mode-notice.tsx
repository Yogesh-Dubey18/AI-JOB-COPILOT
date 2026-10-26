"use client";

import { Info, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AI_MODE_EVENT, type AiModeDetail } from "@/lib/ai-mode";

const AGENT_LABELS: Record<string, string> = {
  "resume-intelligence": "Resume analysis",
  "resume-writer": "Resume writer",
  "job-match": "Job match",
  "trust-safety": "Scam check",
  "application-drafting": "Application drafts",
  "interview-coach": "Interview coach",
  "career-planner": "Career planner",
  "career-mentor": "Mentor chat",
  "professional-presence": "Portfolio & LinkedIn"
};

const DISMISS_KEY = "ajc:ai-fallback-dismissed";

/**
 * Tells the user, honestly, when a result on screen was produced by a
 * rule-based fallback instead of a live AI model. Driven by the X-AI-Mode
 * response header so it needs no per-page wiring.
 */
export function AiModeNotice() {
  const [agents, setAgents] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      /* storage unavailable - keep notice visible */
    }
    const onMode = (event: Event) => {
      const detail = (event as CustomEvent<AiModeDetail>).detail;
      if (detail?.mode === "fallback") {
        setAgents((current) => Array.from(new Set([...current, ...detail.fallbackAgents])));
      }
    };
    window.addEventListener(AI_MODE_EVENT, onMode);
    return () => window.removeEventListener(AI_MODE_EVENT, onMode);
  }, []);

  if (!agents.length || dismissed) return null;

  const names = agents.map((id) => AGENT_LABELS[id] || id).join(", ");
  return (
    <div role="status" aria-live="polite" className="mb-4 flex items-start gap-3 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-foreground">
        <span className="font-semibold">Rule-based estimate.</span>{" "}
        The AI engine is not configured or did not respond, so {names} used built-in rules computed only from your data. Results are less detailed - review them before acting.
      </p>
      <button
        type="button"
        onClick={() => {
          setDismissed(true);
          try { window.sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
        }}
        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Dismiss notice"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
