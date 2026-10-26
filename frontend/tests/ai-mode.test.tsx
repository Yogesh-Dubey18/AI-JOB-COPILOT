import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { announceAiMode } from "@/lib/ai-mode";
import { AiModeNotice } from "@/components/shared/ai-mode-notice";

describe("AI mode transparency", () => {
  it("stays hidden for live-model and non-AI responses", () => {
    render(<AiModeNotice />);
    act(() => announceAiMode(new Headers({ "x-ai-mode": "ai", "x-ai-agents": "job-match" })));
    act(() => announceAiMode(new Headers()));
    expect(screen.queryByText(/Rule-based estimate/i)).toBeNull();
  });

  it("names the agents that fell back and can be dismissed", () => {
    window.sessionStorage.clear();
    render(<AiModeNotice />);
    act(() => announceAiMode(new Headers({ "x-ai-mode": "fallback", "x-ai-agents": "trust-safety", "x-ai-fallback-agents": "trust-safety" })));
    expect(screen.getByText(/Rule-based estimate/i)).toBeInTheDocument();
    expect(screen.getByText(/Scam check/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /dismiss notice/i }));
    expect(screen.queryByText(/Rule-based estimate/i)).toBeNull();
  });
});
