import { describe, expect, it } from "vitest";
import {
  evaluateProofConfidence,
  getGitHubProviderStatus,
  parseGitHubRepoUrl,
  sanitizeGitHubProof
} from "../src/services/github-proof.service.js";

describe("GitHub proof verification readiness", () => {
  it("parses valid GitHub repository URLs into canonical owner/repo data", () => {
    const parsed = parseGitHubRepoUrl("https://github.com/Yogesh-Dubey18/AI-JOB-COPILOT/tree/main");

    expect(parsed.owner).toBe("Yogesh-Dubey18");
    expect(parsed.repo).toBe("AI-JOB-COPILOT");
    expect(parsed.repoUrl).toBe("https://github.com/Yogesh-Dubey18/AI-JOB-COPILOT");
  });

  it("rejects invalid or non-GitHub repository URLs", () => {
    expect(() => parseGitHubRepoUrl("https://example.com/test/repo")).toThrow(/github.com/i);
    expect(() => parseGitHubRepoUrl("https://github.com/topics/react")).toThrow(/repository/i);
  });

  it("does not invent stars, forks, commits, or verification fields in manual fallback", () => {
    const proof = sanitizeGitHubProof({
      repoUrl: "https://github.com/example/manual-proof",
      evidenceStatus: "manual_repo_link",
      confidence: "medium",
      metadata: null
    });

    const serialized = JSON.stringify(proof);
    expect(proof?.confidence).toBe("medium");
    expect(proof?.evidenceStatus).toBe("manual_repo_link");
    expect(serialized).not.toMatch(/stars|forks|commits|watchers|verifiedByGitHub/i);
  });

  it("classifies proof confidence honestly", () => {
    const metadata = {
      repoName: "react-portfolio",
      description: "React portfolio builder",
      languages: ["TypeScript"],
      readmePresent: true,
      lastUpdated: "2026-05-28T00:00:00Z",
      publicUrl: "https://github.com/example/react-portfolio",
      defaultBranch: "main",
      topics: ["portfolio"]
    };

    expect(evaluateProofConfidence({
      repoUrl: metadata.publicUrl,
      metadata,
      keywordMatches: ["react"]
    })).toEqual({ confidence: "strong", evidenceStatus: "evidence_available" });

    expect(evaluateProofConfidence({ repoUrl: metadata.publicUrl })).toEqual({
      confidence: "medium",
      evidenceStatus: "manual_repo_link"
    });

    expect(evaluateProofConfidence({ selfReported: true })).toEqual({
      confidence: "self-reported",
      evidenceStatus: "self_reported"
    });

    expect(evaluateProofConfidence({})).toEqual({
      confidence: "weak",
      evidenceStatus: "missing"
    });
  });

  it("keeps provider status honest without claiming live verification by default", () => {
    const status = getGitHubProviderStatus();

    expect(status.provider).toBe("github");
    expect(status.status).not.toBe("live");
    expect(status.tested).toBe(false);
    expect(status.requiredEnvVars).toContain("GITHUB_TOKEN");
  });
});
