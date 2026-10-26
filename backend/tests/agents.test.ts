import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { resetMemoryStore } from "../src/utils/memoryStore.js";
import {
  jdTailoredResumeFallback,
  jobMatchFallback,
  mockInterviewFallback,
  resumeAnalysisFallback,
  scamFallback,
  tailoredResumeFallback
} from "../src/agents/fallbacks.js";
import { AGENTS, getAgentForFeature } from "../src/agents/registry.js";
import { getDeterministicKitFallback } from "../src/ai/ai.service.js";
import { parseResumeText } from "../src/services/resume-parser.service.js";

// A deliberately non-developer resume: the old fallbacks and parser injected MERN content into it.
const ANALYST_RESUME_TEXT = [
  "Priya Sharma",
  "priya@example.com | +91 9999999999",
  "SUMMARY",
  "Data analyst with 2 years of Excel and SQL experience.",
  "SKILLS",
  "Excel, SQL, Tableau, Python",
  "EXPERIENCE",
  "Analyst, Acme Corp, 2023-2025",
  "- Built weekly sales dashboards in Tableau",
  "EDUCATION",
  "B.Com, Delhi University, 2022"
].join("\n");

const FABRICATED = /B\.C\.A|MERN|300\+|500\+|99\.9|Self-Directed|fully authorized|start immediately/i;

describe("Resume parser grounding", () => {
  const parsed: any = parseResumeText(ANALYST_RESUME_TEXT, "Priya Sharma");

  it("keeps explicitly listed non-developer skills", () => {
    for (const skill of ["Excel", "SQL", "Tableau", "Python"]) expect(parsed.skills).toContain(skill);
  });

  it("splits comma-separated experience headers instead of inventing a company or dates", () => {
    expect(parsed.experience[0].role).toBe("Analyst");
    expect(parsed.experience[0].company).toBe("Acme Corp");
    expect(parsed.experience[0].duration).toBe("2023-2025");
    expect(JSON.stringify(parsed.experience)).not.toMatch(/Self-Directed|2022 – Present/);
  });

  it("recognises commerce degrees and does not read a degree as a location", () => {
    expect(parsed.education.length).toBeGreaterThan(0);
    expect(parsed.location).not.toBe("Com, Delhi");
  });

  it("does not invent a headline, soft skills or spoken languages", () => {
    expect(parsed.title).not.toMatch(/MERN|Full Stack/);
    expect(parsed.softSkills).toEqual([]);
    expect(parsed.languages).not.toContain("Hindi (Native)");
  });
});

describe("Trust & Safety agent fallback", () => {
  it("does not flag a normal posting as high risk", () => {
    const result = scamFallback({
      company: "Infosys",
      jobDescription: "Infosys is hiring a Data Analyst in Bengaluru. Apply via careers.infosys.com. Salary 6-8 LPA. Interview process: online test and two rounds."
    });
    expect(result.riskLevel).toBe("Low");
    expect(result.redFlags).toEqual([]);
    expect(result.trustScore).toBeGreaterThanOrEqual(70);
  });

  it("flags evidenced scam signals", () => {
    const result = scamFallback({
      recruiterContact: "hr.infosys.jobs@gmail.com",
      jobDescription: "Urgent hiring! Selected without interview. Pay a refundable deposit of Rs 2500 registration fee on WhatsApp and send your Aadhaar and bank details."
    });
    expect(result.riskLevel).toBe("High");
    expect(result.redFlags.join(" ")).toMatch(/fee/i);
    expect(result.redFlags.join(" ")).toMatch(/personal email/i);
    expect(result.verificationSteps.length).toBeGreaterThan(0);
  });

  it("reports Unknown when there is not enough text", () => {
    expect(scamFallback({ jobDescription: "Hi" }).riskLevel).toBe("Unknown");
  });
});

describe("Interview Coach agent fallback", () => {
  it("scores evasive answers at the floor", () => {
    const result = mockInterviewFallback({ question: "Explain SQL joins", answer: "idk" });
    expect(result.score).toEqual({ confidence: 1, technicalAccuracy: 1, communication: 1, completeness: 1, projectClarity: 1 });
  });

  it("scores a structured, specific answer higher than a short one", () => {
    const strong = mockInterviewFallback({
      question: "Explain SQL joins",
      answer: "A SQL join combines rows from two tables on a related column. First, an inner join returns only matching rows; a left join keeps every row from the left table. For example, in my sales dashboard project I left-joined orders to customers so customers with zero orders still appeared, which led to finding 120 inactive accounts. The trade-off is that outer joins can be slower on large tables, so I added an index on customer_id."
    });
    const weak = mockInterviewFallback({ question: "Explain SQL joins", answer: "Joins combine tables together in SQL." });
    const total = (s: any) => s.confidence + s.technicalAccuracy + s.communication + s.completeness;
    expect(total(strong.score)).toBeGreaterThan(total(weak.score));
  });
});

describe("Resume and Job Match agent fallbacks never fabricate", () => {
  const resume = { parsedData: parseResumeText(ANALYST_RESUME_TEXT, "Priya Sharma"), rawText: ANALYST_RESUME_TEXT };

  it("job match score reflects real keyword coverage", () => {
    const dataJob = jobMatchFallback({ resume, job: { title: "Data Analyst", skillsRequired: ["SQL", "Excel", "Tableau", "Power BI"] }, computedFit: {} });
    const mernJob = jobMatchFallback({ resume, job: { title: "MERN Developer", skillsRequired: ["React", "Node.js", "MongoDB", "Express"] }, computedFit: {} });
    expect(dataJob.matchScore).toBe(75);
    expect(dataJob.missingSkills).toEqual(["Power BI"]);
    expect(mernJob.matchScore).toBe(0);
    expect(mernJob.matchedSkills).toEqual([]);
  });

  it("tailoring without AI keeps original content and reports gaps instead of inserting keywords", () => {
    const result = tailoredResumeFallback({ resume, job: { title: "Data Analyst", skillsRequired: ["SQL", "Power BI"] } });
    expect(result.updatedSummary).toBe("Data analyst with 2 years of Excel and SQL experience.");
    expect(result.updatedSkills).not.toContain("Power BI");
    expect(result.updatedSkills[0]).toBe("SQL");
    expect(result.genuineGaps).toContain("Power BI");
    expect(result.afterAtsScore).toBe(result.beforeAtsScore);
  });

  it("JD tailoring without AI does not inject another person's profile", () => {
    const result = jdTailoredResumeFallback({ resume, jobTitle: "Data Analyst", jobDescription: "SQL, Power BI and Excel reporting" });
    expect(JSON.stringify(result)).not.toMatch(FABRICATED);
    expect(result.resume.summary).toBe("Data analyst with 2 years of Excel and SQL experience.");
    expect(result.matchAnalysis.missingKeywords).toContain("Power BI");
  });

  it("resume analysis fallback mirrors the deterministic score and adds no generic claims", () => {
    const result = resumeAnalysisFallback({ localScore: { atsScore: 47, resumeLevel: "Needs work", sectionScores: { skills: 60 } } });
    expect(result.atsScore).toBe(47);
    expect(result.strengths).toEqual([]);
  });
});

describe("Application Drafting agent fallback", () => {
  it("uses confirmation placeholders for facts only the user can state", () => {
    const kit: any = getDeterministicKitFallback({ job: { title: "Data Analyst", company: "Infosys" }, matchingSkills: ["SQL"] });
    expect(kit.workAuthorizationAnswer).toMatch(/Confirm before sending/);
    expect(kit.noticePeriodAnswer).toMatch(/Confirm before sending/);
    expect(kit.salaryAnswer).toMatch(/Confirm before sending/);
    expect(JSON.stringify(kit)).not.toMatch(/fully authorized|React, Node\.js, MongoDB/);
  });

  it("prefers the user's saved answer-vault entries", () => {
    const kit: any = getDeterministicKitFallback({ job: { title: "Analyst" }, matchingSkills: [], savedAnswers: [{ category: "Logistics", question: "What is your notice period?", answer: "30 days" }] });
    expect(kit.noticePeriodAnswer).toBe("30 days");
  });
});

describe("Agent registry", () => {
  it("assigns every AI feature to exactly one agent", () => {
    const features = ["resume-analysis", "resume-improvement", "world-class-resume", "tailor-resume", "jd-tailored-resume", "job-match", "extract-keywords", "job-parser", "scam-check", "application-kit", "cover-letter", "follow-up-message", "interview-prep", "interview-coach", "mock-interview", "skill-gap", "rejection-analysis", "career-chat", "portfolio-generator", "linkedin-optimizer"];
    for (const feature of features) expect(getAgentForFeature(feature).id).not.toBe("general");
    const all = AGENTS.flatMap((agent) => agent.features);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("Agent API surface", () => {
  beforeEach(() => resetMemoryStore());

  it("serves /api/health for frontend warm-up pings", async () => {
    await request(app).get("/api/health").expect(200);
  });

  it("marks fallback results with X-AI-Mode and lists agents", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send({ fullName: "Agent Test", email: "agents@example.com", password: "Password123!" }).expect(201);
    const scam = await agent.post("/api/ai/scam-check").send({ description: "Pay registration fee on WhatsApp to confirm your selection without interview." }).expect(200);
    expect(scam.headers["x-ai-mode"]).toBe("fallback");
    expect(scam.headers["x-ai-agents"]).toContain("trust-safety");
    expect(scam.body.data.riskLevel).toBe("High");

    const list = await agent.get("/api/ai/agents").expect(200);
    expect(list.body.data.agents.length).toBe(AGENTS.length);
    expect(list.body.data.agents[0]).not.toHaveProperty("instructions");

    const plain = await agent.get("/api/auth/me").expect(200);
    expect(plain.headers["x-ai-mode"]).toBeUndefined();
  });
});
