/**
 * Feature agent registry.
 *
 * Every AI call in the product is owned by exactly one agent. The registry is
 * the single source of truth for each agent's scope, the data it may read,
 * its decision rules (injected into the model prompt), whether a human must
 * approve its output, and how it degrades when the model is unavailable.
 *
 * Agents share one execution path (`run` in ai.service.ts): guarded prompt ->
 * provider with timeout/retry -> zod validation -> grounded fallback ->
 * usage + trace logging. No agent has write access to external systems;
 * anything that leaves the product (emails, applications, exports) is a draft
 * the user must review.
 */
export type AgentSpec = {
  id: string;
  name: string;
  responsibility: string;
  features: string[];
  dataAccess: string[];
  instructions: string[];
  humanApproval: string | null;
  fallback: string;
};

export const AGENTS: AgentSpec[] = [
  {
    id: "resume-intelligence",
    name: "Resume Intelligence Agent",
    responsibility: "Scores a resume for a target role and proposes truthful, specific improvements.",
    features: ["resume-analysis", "resume-improvement"],
    dataAccess: ["selected resume (optionally anonymised)", "target role", "pasted job description", "deterministic ATS score"],
    instructions: [
      "Ground every strength, weakness and suggestion in text that appears in the resume.",
      "Never propose content containing metrics, employers, degrees or skills the resume does not already contain; ask the user to supply them instead.",
      "Keep atsScore within 15 points of the provided deterministic localScore unless you explain why."
    ],
    humanApproval: "User applies each suggested edit individually.",
    fallback: "Deterministic ATS scorer only; no generic strengths or suggestions are added."
  },
  {
    id: "resume-writer",
    name: "Resume Writer Agent",
    responsibility: "Produces role- or job-tailored resume versions from the user's existing resume.",
    features: ["world-class-resume", "tailor-resume", "jd-tailored-resume"],
    dataAccess: ["selected resume parsed data", "target job or pasted job description"],
    instructions: [
      "You may rephrase, reorder and emphasise existing content. You must not add skills, employers, dates, degrees, projects or numbers that are absent from the source resume.",
      "List job keywords the candidate lacks under genuine gaps / missing keywords rather than inserting them.",
      "Scores must reflect keyword coverage of the job by the final resume."
    ],
    humanApproval: "Saved as a new resume version; user reviews before exporting or sending.",
    fallback: "Keeps original content, reorders matched skills first, reports real keyword coverage and gaps."
  },
  {
    id: "job-match",
    name: "Job Match Agent",
    responsibility: "Explains how well a job fits the candidate and extracts structured data from job text.",
    features: ["job-match", "extract-keywords", "job-parser"],
    dataAccess: ["job posting", "latest resume", "profile preferences (location, salary, experience)", "deterministic fit scores"],
    instructions: [
      "matchedSkills must appear in the resume; missingSkills must appear in the job posting.",
      "Respect the provided computedFit scores for location, salary and experience; do not contradict them."
    ],
    humanApproval: null,
    fallback: "Keyword-coverage match against the job's required skills plus deterministic fit reasons."
  },
  {
    id: "trust-safety",
    name: "Job Trust & Safety Agent",
    responsibility: "Flags recruitment-fraud signals in job postings and recruiter messages.",
    features: ["scam-check"],
    dataAccess: ["pasted posting / message text", "company name", "recruiter contact"],
    instructions: [
      "Only report red flags that are evidenced in the provided text; quote or paraphrase the evidence.",
      "If information is insufficient, say so with riskLevel \"Unknown\" rather than guessing.",
      "Always include verificationSteps."
    ],
    humanApproval: null,
    fallback: "Rule-based detector for fees, sensitive-data requests, no-interview offers, personal email domains, messaging-only contact and urgency."
  },
  {
    id: "application-drafting",
    name: "Application Drafting Agent",
    responsibility: "Drafts cover letters, recruiter messages, follow-ups and screening answers.",
    features: ["application-kit", "cover-letter", "follow-up-message"],
    dataAccess: ["selected job", "selected resume version", "user's saved answer vault", "requested tone"],
    instructions: [
      "Everything you write is a draft for the user to review; never state that anything was sent or submitted.",
      "For salary, notice period, work authorization, visa or availability, use the user's saved answers or write a [Confirm before sending: ...] placeholder. Never assert these facts."
    ],
    humanApproval: "Required. Drafts are never sent automatically.",
    fallback: "Tone-aware templates filled only with the job title, company and matched skills; sensitive facts become placeholders."
  },
  {
    id: "interview-coach",
    name: "Interview Coach Agent",
    responsibility: "Prepares interview plans and evaluates mock-interview answers.",
    features: ["interview-prep", "interview-coach", "mock-interview"],
    dataAccess: ["interview record", "related job", "resume skills", "the user's answer"],
    instructions: [
      "Score the answer actually given. An empty, evasive or 'I don't know' answer must receive low scores.",
      "Feedback must reference specific parts of the answer."
    ],
    humanApproval: null,
    fallback: "Heuristic answer scoring (length, structure, examples, question-term coverage); prep plans built from job and resume keywords."
  },
  {
    id: "career-planner",
    name: "Career Planner Agent",
    responsibility: "Turns skill gaps and rejections into a concrete learning and application plan.",
    features: ["skill-gap", "rejection-analysis"],
    dataAccess: ["current skills", "target role required skills", "application outcome"],
    instructions: ["Plans must target the provided missing skills; do not invent new gaps."],
    humanApproval: null,
    fallback: "Plan generated from the computed missing-skill list."
  },
  {
    id: "career-mentor",
    name: "Career Mentor Agent",
    responsibility: "Answers free-form career questions using the user's own data.",
    features: ["career-chat"],
    dataAccess: ["user message", "client-supplied page metadata"],
    instructions: ["If the question needs data you do not have, say what is missing and which feature can produce it."],
    humanApproval: null,
    fallback: "States that the mentor is unavailable and points to features that work without AI."
  },
  {
    id: "professional-presence",
    name: "Professional Presence Agent",
    responsibility: "Drafts portfolio and LinkedIn copy from the user's resume.",
    features: ["portfolio-generator", "linkedin-optimizer"],
    dataAccess: ["selected resume", "portfolio inputs"],
    instructions: ["Use only projects, skills and experience present in the input."],
    humanApproval: "User publishes portfolio / LinkedIn changes manually.",
    fallback: "Copies the user's own summary, skills and project names without embellishment."
  }
];

const BY_FEATURE = new Map<string, AgentSpec>(AGENTS.flatMap((agent) => agent.features.map((f) => [f, agent] as const)));

export function getAgentForFeature(feature: string): AgentSpec {
  return BY_FEATURE.get(feature) || {
    id: "general",
    name: "General Agent",
    responsibility: "Unclassified AI feature",
    features: [feature],
    dataAccess: [],
    instructions: [],
    humanApproval: null,
    fallback: "Static fallback"
  };
}

export function listAgents() {
  return AGENTS.map(({ instructions, ...rest }) => ({ ...rest, ruleCount: instructions.length }));
}
