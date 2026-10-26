/**
 * Deterministic, input-grounded fallbacks for every agent.
 *
 * These run when no AI provider is configured, the provider fails, or the
 * provider returns output that fails schema validation. Rules:
 *  - Never invent experience, employers, degrees, dates, metrics or skills.
 *  - Scores must be computed from the actual input, never constants.
 *  - Facts only the user can supply (salary, notice period, work
 *    authorization) become explicit "[Confirm before sending: ...]" placeholders.
 */
import {
  clampScore,
  collectResumeSkills,
  confirmPlaceholder,
  extractKeywordsFromText,
  getParsed,
  jobKeywords,
  keywordOverlap,
  uniqueStrings
} from "./grounding.js";
import { getRoleKeywords } from "../services/ats-scoring.service.js";

const FALLBACK_NOTE = "Rule-based estimate (AI provider unavailable). Review before relying on it.";

// ---------------------------------------------------------------- resume analysis
export function resumeAnalysisFallback(context: any) {
  const local = context?.localScore || {};
  return {
    // Mirror the deterministic ATS score so the 35/65 blend is not skewed by a constant.
    atsScore: clampScore(Number(local.atsScore) || 0),
    resumeLevel: String(local.resumeLevel || "Unrated"),
    sectionScores: (local.sectionScores && typeof local.sectionScores === "object" ? local.sectionScores : {}) as Record<string, number>,
    // Deterministic strengths/weaknesses are already merged in by the service; adding generic text here would be noise.
    strengths: [] as string[],
    weaknesses: [] as string[],
    missingKeywords: [] as string[],
    improvementSuggestions: [] as string[],
    recruiterView: ""
  };
}

// ---------------------------------------------------------------- job match
function fitLabel(score: number) {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Good";
  if (score >= 40) return "Partial";
  return "Weak";
}

export function jobMatchFallback(context: any) {
  const keywords = jobKeywords(context?.job);
  const { matched, missing, coverage } = keywordOverlap(context?.resume, keywords);
  const fit = context?.computedFit || {};
  const riskFlags: string[] = [];
  if (!keywords.length) riskFlags.push("Job posting lists no recognisable skills; match score is low-confidence.");
  if (!collectResumeSkills(context?.resume).length) riskFlags.push("No skills detected on your resume; add a skills section for accurate matching.");
  const selectionChance = coverage >= 75 ? "High" : coverage >= 50 ? "Medium" : "Low";
  return {
    matchScore: coverage,
    selectionChance,
    matchedSkills: matched,
    missingSkills: missing,
    experienceFit: fit.experienceFit?.reason || fitLabel(Number(fit.experienceFit?.score) || 0),
    salaryFit: fit.salaryFit?.reason || fitLabel(Number(fit.salaryFit?.score) || 0),
    locationFit: fit.locationFit?.reason || fitLabel(Number(fit.locationFit?.score) || 0),
    recommendationReason: keywords.length
      ? `Your resume covers ${matched.length} of ${keywords.length} skills this job asks for (${coverage}%).`
      : "Could not extract required skills from this posting.",
    applyRecommendation: coverage >= 60
      ? "Reasonable fit. Tailor your resume to the matched skills before applying."
      : missing.length
        ? `Close the most important gaps first (${missing.slice(0, 3).join(", ")}) or apply only if you have this experience and it is missing from your resume.`
        : "Review the posting manually before applying.",
    riskFlags
  };
}

// ---------------------------------------------------------------- resume tailoring
function projectToString(project: any): string {
  if (typeof project === "string") return project;
  if (!project || typeof project !== "object") return "";
  const head = [project.name || project.title, project.tech || (Array.isArray(project.techStack) ? project.techStack.join(", ") : "")].filter(Boolean).join(" - ");
  const bullets = Array.isArray(project.bullets) ? project.bullets.join(" ") : project.description || "";
  return [head, bullets].filter(Boolean).join(": ");
}

export function tailoredResumeFallback(context: any) {
  const parsed = getParsed(context?.resume);
  const keywords = context?.job ? jobKeywords(context.job) : extractKeywordsFromText(String(context?.targetRole || ""));
  const { matched, missing, coverage } = keywordOverlap(context?.resume, keywords);
  const skills = collectResumeSkills(context?.resume);
  // Only reorder: put skills the job asks for first. Never add skills the user does not have.
  const matchedLower = new Set(matched.map((s) => s.toLowerCase()));
  const orderedSkills = [...skills.filter((s) => matchedLower.has(s.toLowerCase())), ...skills.filter((s) => !matchedLower.has(s.toLowerCase()))];
  return {
    beforeAtsScore: coverage,
    afterAtsScore: coverage,
    addedKeywords: [] as string[],
    genuineGaps: missing,
    keywordStuffingWarnings: [] as string[],
    updatedSummary: String(parsed.summary || ""),
    updatedSkills: orderedSkills,
    improvedProjects: (Array.isArray(parsed.projects) ? parsed.projects : []).map(projectToString).filter(Boolean),
    changedSections: orderedSkills.length ? ["skills (reordered to surface matched keywords)"] : [],
    sectionOrdering: ["summary", "skills", "experience", "projects", "education"],
    pageLimit: 1,
    pdfUrl: ""
  };
}

export function jdTailoredResumeFallback(context: any) {
  const parsed = getParsed(context?.resume);
  const job = { title: context?.jobTitle, description: context?.jobDescription };
  const keywords = jobKeywords(job);
  const { matched, missing, coverage } = keywordOverlap(context?.resume, keywords);
  return {
    resume: {
      name: String(parsed.name || ""),
      // Keep the candidate's own headline; fall back to the target title only as a label.
      title: String(parsed.title || context?.jobTitle || ""),
      contact: parsed.contact || { email: parsed.email || "", phone: parsed.phone || "", github: parsed.github || "", linkedin: parsed.linkedin || "", location: parsed.location || "" },
      summary: String(parsed.summary || ""),
      skills: parsed.categorizedSkills || parsed.skills || {},
      projects: parsed.projects || [],
      experience: parsed.experience || [],
      education: parsed.education || [],
      certifications: parsed.certifications || [],
      achievements: parsed.achievements || [],
      softSkills: parsed.softSkills || [],
      languages: parsed.languages || [],
      atsScore: coverage,
      atsKeywords: matched
    },
    matchAnalysis: {
      matchScore: coverage,
      matchedKeywords: matched,
      missingKeywords: missing,
      suggestions: missing.length
        ? missing.slice(0, 5).map((k) => `If you genuinely have ${k} experience, add it with a concrete example; otherwise treat it as a learning gap.`)
        : ["Your resume already mentions every skill detected in this job description."],
      strengthsForThisRole: matched.slice(0, 6).map((k) => `Resume mentions ${k}, which this role asks for.`),
      recommendedToApply: coverage >= 60,
      note: FALLBACK_NOTE
    }
  };
}

// ---------------------------------------------------------------- resume improvements
export function resumeImprovementFallback(context: any) {
  const parsed = getParsed(context?.resume);
  const improvements: any[] = [];
  const summary = String(parsed.summary || "");
  const push = (section: string, issue: string, current: string, improved: string, impact: string, reason: string) =>
    improvements.push({ id: `imp_${improvements.length + 1}`, section, issue, current, improved, impact, reason });

  if (!summary.trim()) push("SUMMARY", "Resume has no professional summary", "", "", "high", "Write 2-3 lines stating your target role, strongest skills and one verified result.");
  else if (summary.split(/\s+/).length < 20) push("SUMMARY", "Summary is very short", summary, "", "medium", "Expand with your target role and one or two concrete, truthful outcomes.");

  const bullets: string[] = [
    ...(parsed.experience || []).flatMap((e: any) => e?.bullets || []),
    ...(parsed.projects || []).flatMap((p: any) => p?.bullets || [])
  ].filter((b: unknown): b is string => typeof b === "string");
  const unquantified = bullets.filter((b) => !/\d/.test(b));
  unquantified.slice(0, 3).forEach((b) => push("EXPERIENCE", "Bullet has no measurable outcome", b, "", "high", "Add a real number (users, time saved, % change, volume) if you can verify it."));

  if (!(parsed.skills || []).length) push("SKILLS", "No skills section detected", "", "", "high", "ATS systems rely on an explicit skills list.");
  if (!(parsed.education || []).length) push("EDUCATION", "No education entries detected", "", "", "medium", "Add your degree, institution and year, or check the parsed data if it was missed.");

  const quickWins: string[] = [];
  if (!parsed.linkedin) quickWins.push("Add your LinkedIn URL to the header");
  if (!parsed.email) quickWins.push("Add a professional email address");
  if (!parsed.phone) quickWins.push("Add a phone number");
  if (unquantified.length) quickWins.push(`Quantify ${unquantified.length} bullet(s) that currently have no numbers`);

  const total = Math.max(1, bullets.length);
  const overallScore = clampScore(40 + (summary ? 15 : 0) + ((parsed.skills || []).length ? 15 : 0) + ((parsed.education || []).length ? 10 : 0) + Math.round(((total - unquantified.length) / total) * 20));
  return { overallScore, improvements, quickWins, missingKeywords: [] as string[], note: FALLBACK_NOTE };
}

// ---------------------------------------------------------------- scam detection
type ScamRule = { pattern: RegExp; penalty: number; flag: string };

const SCAM_RULES: ScamRule[] = [
  { pattern: /\b(registration|training|security|joining|processing|application|kit|onboarding|verification)\s+(fee|fees|charge|charges|deposit|amount)\b|\bpay\s+(rs\.?|inr|₹)|\brefundable\s+deposit\b|\bpay\s+(a|the)?\s*(small\s+)?(fee|amount)\b/i, penalty: 40, flag: "Asks for a payment, deposit or fee - legitimate employers do not charge candidates" },
  { pattern: /\b(aadhaar|aadhar|pan\s*card|bank\s+(account|details)|otp|cvv|atm\s+pin|passport\s+copy)\b/i, penalty: 20, flag: "Requests sensitive identity or banking details before an offer" },
  { pattern: /\b(no|without\s+(any\s+)?)\s*interview\b|\bdirect\s+(joining|selection)\b|\bselected\s+without\b/i, penalty: 15, flag: "Promises selection without an interview" },
  { pattern: /\b(earn|income|salary)\b.{0,40}\b(per\s+day|daily|per\s+week|weekly|per\s+hour)\b|\b(earn|make)\s+(rs\.?|₹|inr)?\s?\d[\d,]*\s*(\+|k)?\s*(from\s+home|daily)|\bno\s+experience\s+(required|needed)\b.{0,60}\b(earn|lakh|₹)/i, penalty: 15, flag: "Unrealistic or daily/weekly earnings promise" },
  { pattern: /\b(whatsapp|telegram)\b/i, penalty: 10, flag: "Recruitment conducted over WhatsApp or Telegram" },
  { pattern: /\b(urgent(ly)?\s+hiring|limited\s+(seats|slots)|immediate\s+joining|act\s+now|today\s+only|within\s+24\s+hours|last\s+chance)\b/i, penalty: 8, flag: "High-pressure urgency language" },
  { pattern: /\b(bit\.ly|tinyurl\.com|t\.me|goo\.gl|cutt\.ly)\b/i, penalty: 8, flag: "Uses shortened or messaging links instead of an official careers page" },
  { pattern: /\b(task[-\s]?based|like\s+(and|&)\s+subscribe|rate\s+(products|hotels)|crypto\s+(task|investment))\b/i, penalty: 25, flag: "Matches common task/investment scam patterns" }
];

const PERSONAL_EMAIL = /[a-z0-9._%+-]+@(gmail|yahoo|ymail|outlook|hotmail|rediffmail|proton(mail)?|icloud|aol)\.[a-z.]+/i;

export function scamFallback(context: any) {
  const text = [context?.jobTitle, context?.title, context?.company, context?.recruiterContact, context?.jobDescription, context?.description, context?.text]
    .filter((v) => typeof v === "string").join("\n");
  const redFlags: string[] = [];
  let score = 85;
  for (const rule of SCAM_RULES) {
    if (rule.pattern.test(text)) { score -= rule.penalty; redFlags.push(rule.flag); }
  }
  const personal = text.match(PERSONAL_EMAIL);
  if (personal) { score -= 12; redFlags.push(`Recruiter uses a personal email domain (${personal[1].toLowerCase()})`); }
  const positives: string[] = [];
  if (/\bcareers?\.[a-z0-9-]+\.[a-z]{2,}|[a-z0-9-]+\.[a-z]{2,}\/careers\b/i.test(text)) { score += 5; positives.push("References an official careers page"); }
  if (/\b(interview|assessment|technical round|hr round)\b/i.test(text) && !/\bno\s+interview\b/i.test(text)) positives.push("Describes a normal interview process");

  const insufficient = text.trim().length < 80;
  const trustScore = clampScore(insufficient ? Math.min(score, 60) : score);
  const riskLevel = insufficient && !redFlags.length ? "Unknown" : trustScore >= 70 ? "Low" : trustScore >= 45 ? "Medium" : "High";
  const verificationSteps = [
    "Find the role on the company's official careers website",
    "Check that the recruiter's email domain matches the company's website",
    "Look the recruiter up on LinkedIn and confirm they work at the company",
    "Never pay any fee or share OTPs, bank or Aadhaar details before a written offer"
  ];
  const recommendation = insufficient && !redFlags.length
    ? "Not enough information to assess. Paste the full posting or message, including recruiter contact details."
    : riskLevel === "High"
      ? "Do not pay or share personal documents. Verify the company and recruiter independently before engaging."
      : riskLevel === "Medium"
        ? "Proceed carefully and verify the recruiter and company through official channels."
        : "No common scam signals detected. Still verify the posting on the company's official site.";
  return { trustScore, riskLevel, redFlags, positiveSignals: positives, recommendation, verificationSteps, note: FALLBACK_NOTE };
}

// ---------------------------------------------------------------- mock interview
const STOPWORDS = new Set("the a an and or of to in on for with how what why when where which who is are was were do does did you your me my i we our it this that be can could would should explain describe tell about".split(" "));

export function mockInterviewFallback(context: any) {
  const answer = String(context?.answer || "").trim();
  const question = String(context?.question || "");
  const words = answer ? answer.split(/\s+/).filter(Boolean) : [];
  const wc = words.length;
  const dontKnow = /^(idk|i\s*don'?t\s*know|no\s*idea|not\s*sure|pass|skip|n\/?a)\.?$/i.test(answer) || wc < 4;
  const qTerms = uniqueStrings(question.toLowerCase().split(/[^a-z0-9+#.]+/).filter((t) => t.length > 2 && !STOPWORDS.has(t)));
  const aLower = answer.toLowerCase();
  const termCoverage = qTerms.length ? qTerms.filter((t) => aLower.includes(t)).length / qTerms.length : 0;
  const hasNumbers = /\d/.test(answer);
  const hasExample = /\b(for example|for instance|in my|at my|when i|i built|i led|i designed|i implemented|we built|project)\b/i.test(answer);
  const hasStructure = /\b(first|second|then|finally|because|as a result|result|so that|which led)\b/i.test(answer);
  const hasTradeoff = /\b(trade-?off|instead of|alternatively|downside|however|but)\b/i.test(answer);

  const s = (v: number) => clampScore(v, 1, 10);
  const lengthScore = wc >= 60 && wc <= 250 ? 3 : wc >= 30 ? 2 : wc >= 12 ? 1 : 0;
  const score = dontKnow
    ? { confidence: 1, technicalAccuracy: 1, communication: 1, completeness: 1, projectClarity: 1 }
    : {
        confidence: s(3 + lengthScore + (hasStructure ? 2 : 0) + (hasNumbers ? 1 : 0)),
        technicalAccuracy: s(2 + Math.round(termCoverage * 5) + (hasTradeoff ? 2 : 0)),
        communication: s(3 + lengthScore + (hasStructure ? 3 : 0)),
        completeness: s(2 + lengthScore + Math.round(termCoverage * 3) + (hasExample ? 2 : 0)),
        projectClarity: s(2 + (hasExample ? 4 : 0) + (hasNumbers ? 2 : 0))
      };

  const tips: string[] = [];
  if (dontKnow) tips.push("It is fine not to know - say what you do know, how you would find the answer, and relate it to something you have done.");
  else {
    if (wc < 30) tips.push(`Your answer is short (${wc} words); aim for 60-150 words.`);
    if (wc > 250) tips.push(`Your answer is long (${wc} words); lead with the key point and trim detail.`);
    if (!hasExample) tips.push("Add one concrete example from your own work or projects.");
    if (!hasNumbers) tips.push("Include a measurable result if you have one.");
    if (!hasStructure) tips.push("Structure it: situation, what you did, and the result.");
    if (qTerms.length && termCoverage < 0.5) tips.push(`Address the question directly - it asks about ${qTerms.slice(0, 3).join(", ")}.`);
  }
  return {
    score,
    feedback: `${FALLBACK_NOTE} ${tips.join(" ") || "Clear, structured answer."}`.trim(),
    improvedAnswer: "Structure: (1) one-sentence direct answer, (2) a specific example from your own experience - what you did and why, (3) the outcome, with a number if you have one, (4) what you would do differently.",
    nextQuestion: context?.role ? `Tell me about a challenging problem you solved that is relevant to a ${context.role} role.` : "Tell me about a challenging problem you solved recently and how you approached it."
  };
}

// ---------------------------------------------------------------- interview prep / coach
function topicsFrom(context: any): string[] {
  const job = context?.job || context?.interview?.job || {};
  const fromJob = jobKeywords({ ...job, title: job.title || context?.interview?.role || context?.role, description: [job.description, context?.interview?.notes, context?.jobDescription].filter(Boolean).join("\n") });
  const fromResume = collectResumeSkills(context?.resume).slice(0, 6);
  const role = job.title || context?.interview?.role || context?.role;
  // With no job or resume to ground on, fall back to the published keyword bank for the role.
  const fromRole = !fromJob.length && !fromResume.length && role ? getRoleKeywords(String(role)) : [];
  return uniqueStrings([...fromJob, ...fromResume, ...fromRole], 8);
}

export function interviewPrepFallback(context: any) {
  const topics = topicsFrom(context);
  const company = context?.interview?.company || context?.job?.company || context?.company || "";
  const role = context?.interview?.role || context?.job?.title || context?.role || "the role";
  return {
    technicalTopics: topics,
    technicalQuestions: topics.slice(0, 5).map((t) => `Explain how you have used ${t} and a problem you solved with it.`),
    hrQuestions: ["Tell me about yourself.", company ? `Why do you want to work at ${company}?` : "Why do you want this role?", "Describe a time you handled a difficult deadline."],
    projectQuestions: ["Walk me through your most relevant project end to end.", "What was your specific contribution?", "What would you improve if you rebuilt it?"],
    codingQuestions: [] as string[],
    systemDesignQuestions: [] as string[],
    companyResearch: company
      ? [`Read ${company}'s product and about pages`, `Find recent news about ${company}`, `Prepare two thoughtful questions about the ${role} team`]
      : ["Research the company's products and recent news", "Prepare two thoughtful questions for the interviewer"],
    finalPreparationPlan: [`Map each requirement of ${role} to an example from your resume`, ...topics.slice(0, 3).map((t) => `Revise ${t}`), "Do one timed mock interview"]
  };
}

export function interviewCoachFallback(context: any) {
  const prep = interviewPrepFallback(context);
  return {
    readinessScore: 0,
    focusAreas: prep.technicalTopics.slice(0, 4),
    practicePlan: prep.finalPreparationPlan,
    projectQuestions: prep.projectQuestions,
    hrQuestions: prep.hrQuestions,
    dsaQuestions: [] as string[],
    note: "Readiness score requires an AI provider or completed mock interviews."
  };
}

// ---------------------------------------------------------------- skill gap
export function skillGapFallback(context: any) {
  const missing = uniqueStrings(context?.missingSkills || [], 10);
  const required = uniqueStrings(context?.requiredSkills || [], 10);
  const priority = missing.length ? missing.slice(0, 4) : required.slice(0, 4);
  return {
    targetRole: String(context?.targetRole || ""),
    missingSkills: missing,
    prioritySkills: priority,
    sevenDayPlan: priority.length
      ? priority.flatMap((s) => [`Learn ${s} fundamentals from official docs`, `Build a small exercise using ${s}`]).slice(0, 7)
      : ["Review the target role's job descriptions and list required skills"],
    thirtyDayPlan: priority.map((s, i) => `Week ${i + 1}: ${s} - learn, build a mini project, add it to your resume truthfully`),
    projectSuggestions: priority.length >= 2 ? [`A small project combining ${priority.slice(0, 2).join(" and ")}`] : priority.map((s) => `A small project using ${s}`)
  };
}

// ---------------------------------------------------------------- rejection analysis
export function rejectionFallback(context: any) {
  return {
    likelyReason: "Specific reasons cannot be determined without AI analysis or employer feedback. Common causes are keyword mismatch, experience mismatch, or high applicant volume.",
    improvementPlan: ["Run job match on similar roles to find recurring skill gaps", "Tailor your resume for each application", "Ask the recruiter politely for feedback"],
    resumeChanges: ["Check that your resume mentions the skills the job lists, where truthful", "Add measurable outcomes to bullets where you can verify them"],
    interviewTopics: topicsFrom(context).slice(0, 4),
    nextActions: ["Review the job description again", "Run a resume analysis against it", "Apply to closer-matching roles"]
  };
}

// ---------------------------------------------------------------- simple text agents
export function careerChatFallback(_context: any) {
  return {
    answer: "The AI mentor is unavailable right now, so I cannot give a personalised answer. You can still run a resume analysis, job match, or skill-gap report, which work without the AI provider.",
    suggestedActions: ["Analyze resume", "Match jobs", "Skill gaps"],
    note: FALLBACK_NOTE
  };
}

export function keywordFallback(context: any) {
  return { keywords: extractKeywordsFromText(String(context?.description || ""), [], 10) };
}

export function portfolioFallback(context: any) {
  const parsed = getParsed(context?.resume || context);
  return {
    hero: String(parsed.title || context?.headline || ""),
    about: String(parsed.summary || ""),
    skills: collectResumeSkills(context?.resume || context).slice(0, 12),
    projects: (parsed.projects || []).map((p: any) => (typeof p === "string" ? p : p?.name || p?.title)).filter(Boolean),
    note: FALLBACK_NOTE
  };
}

export function linkedinFallback(context: any) {
  const parsed = getParsed(context?.resume || context);
  const skills = collectResumeSkills(context?.resume || context).slice(0, 3);
  const role = context?.targetRole || parsed.title || "";
  return {
    headline: [role, ...skills].filter(Boolean).join(" | "),
    about: String(parsed.summary || ""),
    note: FALLBACK_NOTE
  };
}

export function followUpFallback(context: any) {
  const role = context?.jobTitle || context?.job?.title || context?.role;
  return { message: `Hi, I wanted to politely follow up on my application${role ? ` for the ${role} role` : ""}. I remain interested and would be happy to share any additional details.` };
}

