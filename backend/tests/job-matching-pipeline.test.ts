import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { PDFParse } from "pdf-parse";
import { JobMatchSchema, evaluateJobMatchWithAI } from "../src/services/ai.service.js";
import { generateAtsCompliantPdfResume, type TailoredResumeData } from "../src/services/pdf-export.service.js";
import { jobMatchingQueue, JobMatchingQueue, worker } from "../src/queues/job-matching.worker.js";

async function extractPdfText(buffer: Buffer) {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const res = await parser.getText();
    return typeof res === "string" ? res : res?.text || "";
  } finally {
    await parser.destroy();
  }
}

describe("Step 1: Bulletproof AI Matching Pipeline (Zod Schema + Output)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("validates well-formed AI matching output with JobMatchSchema", () => {
    const validData = {
      match_score: 88,
      dealbreakers: [],
      missing_skills: ["AWS", "Docker"],
      reasoning: "Candidate has strong React and TypeScript experience aligning with the core requirements.",
      verdict: "APPLY" as const,
    };

    const parsed = JobMatchSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.match_score).toBe(88);
      expect(parsed.data.verdict).toBe("APPLY");
      expect(parsed.data.missing_skills).toContain("AWS");
    }
  });

  it("rejects invalid score or malformed verdict in JobMatchSchema", () => {
    const overScore = {
      match_score: 150,
      dealbreakers: [],
      missing_skills: [],
      reasoning: "Score out of range",
      verdict: "APPLY",
    };
    expect(JobMatchSchema.safeParse(overScore).success).toBe(false);

    const invalidVerdict = {
      match_score: 70,
      dealbreakers: [],
      missing_skills: [],
      reasoning: "Invalid verdict type",
      verdict: "MAYBE",
    };
    expect(JobMatchSchema.safeParse(invalidVerdict).success).toBe(false);
  });

  it("handles AI errors gracefully and returns safe fallback object without crashing", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await evaluateJobMatchWithAI(
      "Candidate with React & Flutter experience",
      "Job requiring 3 years React Native & Flutter"
    );

    expect(result).toBeDefined();
    expect(typeof result.match_score).toBe("number");
    expect(Array.isArray(result.dealbreakers)).toBe(true);
    expect(Array.isArray(result.missing_skills)).toBe(true);
    expect(typeof result.reasoning).toBe("string");
    expect(["APPLY", "SKIP"]).toContain(result.verdict);
    expect(result.verdict).toBe("SKIP");
    expect(result.dealbreakers).toContain("AI Parsing Error or Invalid Output Format");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("Step 2: ATS-Optimized Single-Column PDF Resume Generator", () => {
  it("generates an ATS-compliant single-column PDF containing header, summary, skills, and bullets", async () => {
    const data: TailoredResumeData = {
      fullName: "Alex Rivera",
      email: "alex.rivera@example.com",
      phone: "+1-555-0199",
      githubUrl: "https://github.com/alexrivera",
      summary: "Full Stack Software Engineer specializing in modern React, Flutter, and TypeScript applications.",
      skills: ["React", "TypeScript", "Node.js", "Express", "Flutter", "MongoDB", "PostgreSQL"],
      experienceBullets: [
        "Architected and deployed responsive full-stack applications with 99.9% uptime.",
        "Refactored state management to Redux Toolkit, decreasing re-renders by 35%.",
        "Implemented end-to-end authentication and role-based access control using JWT.",
      ],
    };

    const pdfBuffer = await generateAtsCompliantPdfResume(data);

    expect(pdfBuffer).toBeDefined();
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(500);

    // Verify PDF header magic bytes (%PDF-)
    expect(pdfBuffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");

    // Verify ATS parseable content
    const parsedText = await extractPdfText(pdfBuffer);
    expect(parsedText).toContain("Alex Rivera");
    expect(parsedText).toContain("alex.rivera@example.com");
    expect(parsedText).toContain("PROFESSIONAL SUMMARY");
    expect(parsedText).toContain("TECHNICAL SKILLS");
    expect(parsedText).toContain("EXPERIENCE & PROJECTS");
    expect(parsedText).toContain("React, TypeScript");
    expect(parsedText).toContain("Architected and deployed");
  });
});

describe("Step 3: BullMQ Background Queue & Worker Setup", () => {
  it("exports jobMatchingQueue and worker with correct configuration", () => {
    expect(jobMatchingQueue).toBeDefined();
    expect(jobMatchingQueue.name).toBe("job-matching-queue");
    expect(JobMatchingQueue).toBeDefined();
    expect(typeof JobMatchingQueue).toBe("function");

    expect(worker).toBeDefined();
    expect(worker.name).toBe("job-matching-queue");
  });

  afterAll(async () => {
    try {
      await worker.close();
      await jobMatchingQueue.close();
    } catch {
      // Ignore in mock environment
    }
  });
});

