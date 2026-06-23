import type { ZodSchema } from "zod";
import { callJsonModelWithMeta, getAiRuntime, type AiCallMeta } from "./aiClient.js";
import { ApiError } from "../utils/ApiError.js";
import { checkAiCreditLimit } from "../services/usage-limit.service.js";
import { getUsageSummary, recordUsageEvent } from "../services/usage.service.js";
import { createRecord } from "../utils/repository.js";
import { buildresumeAnalysisPrompt } from "./prompts/resumeAnalysis.prompt.js";
import { buildjobMatchPrompt } from "./prompts/jobMatch.prompt.js";
import { buildtailorResumePrompt } from "./prompts/tailorResume.prompt.js";
import { buildapplicationKitPrompt } from "./prompts/applicationKit.prompt.js";
import { buildcoverLetterPrompt } from "./prompts/coverLetter.prompt.js";
import { buildinterviewPrepPrompt } from "./prompts/interviewPrep.prompt.js";
import { buildmockInterviewPrompt } from "./prompts/mockInterview.prompt.js";
import { buildinterviewCoachPrompt } from "./prompts/interviewCoach.prompt.js";
import { buildskillGapPrompt } from "./prompts/skillGap.prompt.js";
import { buildscamDetectorPrompt } from "./prompts/scamDetector.prompt.js";
import { buildcareerChatPrompt } from "./prompts/careerChat.prompt.js";
import { buildrejectionAnalysisPrompt } from "./prompts/rejectionAnalysis.prompt.js";
import { buildportfolioGeneratorPrompt } from "./prompts/portfolioGenerator.prompt.js";
import { buildlinkedinOptimizerPrompt } from "./prompts/linkedinOptimizer.prompt.js";
import { buildfollowUpPrompt } from "./prompts/followUp.prompt.js";
import { buildWorldClassResumePrompt } from "./prompts/worldClassResume.prompt.js";
import {
  applicationKitOutputSchema,
  interviewCoachOutputSchema,
  interviewPrepOutputSchema,
  jobMatchOutputSchema,
  looseObjectOutputSchema,
  mockInterviewOutputSchema,
  rejectionAnalysisOutputSchema,
  resumeAnalysisOutputSchema,
  scamDetectorOutputSchema,
  skillGapOutputSchema,
  tailoredResumeOutputSchema,
  worldClassResumeOutputSchema
} from "./schemas/outputs.js";
import { buildGuardedPrompt, getAiSafetyStatus, type GuardrailResult } from "./guardrails.js";

const resumeAnalysisFallback = {
  atsScore: 82,
  resumeLevel: "Good",
  sectionScores: { summary: 75, skills: 85, projects: 80, experience: 70, education: 90, formatting: 78 },
  strengths: ["Clear technical stack", "Project-led profile", "Readable education section"],
  weaknesses: ["Summary can be sharper", "Some bullets need measurable impact", "Missing deployment keywords"],
  missingKeywords: ["REST APIs", "Authentication", "Testing", "Deployment", "Docker"],
  improvementSuggestions: [
    "Rewrite the summary around target role keywords.",
    "Add outcome-focused project bullets with metrics where truthful.",
    "Group skills by frontend, backend, database, tools, and fundamentals."
  ],
  recruiterView: "Strong fresher or junior MERN profile. Best fit improves when projects show ownership, testing, and deployment details."
};

const jobMatchFallback = {
  matchScore: 88,
  selectionChance: "High",
  matchedSkills: ["React", "Node.js", "MongoDB"],
  missingSkills: ["Docker", "AWS"],
  experienceFit: "Good",
  salaryFit: "Good",
  locationFit: "Good",
  recommendationReason: "Strong MERN stack match with relevant project background.",
  applyRecommendation: "Apply after tailoring resume to the role keywords.",
  riskFlags: []
};

const tailoredResumeFallback = {
  beforeAtsScore: 68,
  afterAtsScore: 91,
  addedKeywords: ["REST API", "JWT authentication", "responsive UI", "MongoDB aggregation"],
  updatedSummary: "Full-stack developer focused on React, Node.js, Express, and MongoDB with hands-on project experience building production-style web apps.",
  updatedSkills: ["React", "TypeScript", "Node.js", "Express", "MongoDB", "REST APIs", "JWT", "Tailwind CSS"],
  improvedProjects: ["Reframed project bullets around API design, authentication, data modeling, and deployment readiness."],
  changedSections: ["summary", "skills", "projects"],
  pdfUrl: ""
};

function cleanText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.replace(/\b(undefined|null)\b/gi, "").replace(/\s+/g, " ").trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean).join(", ");
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).map(cleanText).filter(Boolean).join(" | ");
  }
  return String(value).trim();
}

function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") return value.split(/\n|;/).map((item) => item.trim()).filter(Boolean);
  if (value == null) return [];
  return [value];
}

function uniqueStrings(values: unknown[]) {
  return Array.from(new Set(values.map(cleanText).filter(Boolean)));
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = cleanText(value);
    if (text) return text;
  }
  return "";
}

function linkMatching(links: unknown, pattern: RegExp) {
  return toArray(links).map(cleanText).find((link) => pattern.test(link)) || "";
}

function categorizeWorldClassSkills(skills: string[]) {
  const categories = {
    frontend: [] as string[],
    backend: [] as string[],
    database: [] as string[],
    tools: [] as string[],
    programming: [] as string[],
    other: [] as string[]
  };
  const frontend = /react|next|vue|angular|html|css|tailwind|bootstrap|redux|frontend|ui|typescript|javascript/i;
  const backend = /node|express|nestjs|api|rest|graphql|jwt|auth|server|backend|django|flask|spring/i;
  const database = /mongo|mongoose|mysql|postgres|sql|redis|database|firebase|prisma/i;
  const tools = /git|github|postman|vercel|render|docker|aws|azure|gcp|linux|vs code|vscode/i;
  const programming = /javascript|typescript|java|python|c\+\+|c#|dsa|data structures|algorithms/i;

  for (const skill of uniqueStrings(skills)) {
    if (frontend.test(skill)) categories.frontend.push(skill);
    else if (backend.test(skill)) categories.backend.push(skill);
    else if (database.test(skill)) categories.database.push(skill);
    else if (tools.test(skill)) categories.tools.push(skill);
    else if (programming.test(skill)) categories.programming.push(skill);
    else categories.other.push(skill);
  }

  return categories;
}

function normalizeWorldClassProject(item: unknown, fallbackSkills: string[]) {
  if (typeof item === "string") {
    const [namePart, techPart, ...rest] = item.split("|").map((part) => part.trim());
    const name = cleanText(namePart || item);
    const techStack = uniqueStrings((techPart ? techPart.split(",") : fallbackSkills.slice(0, 4)));
    const originalDetail = cleanText(rest.join(" "));
    return {
      name,
      techStack,
      bullets: [
        originalDetail
          ? `Developed ${name} using ${techStack.join(", ") || "the listed technology stack"}, focusing on ${originalDetail}.`
          : `Built ${name}${techStack.length ? ` using ${techStack.join(", ")}` : ""}, demonstrating hands-on implementation from the uploaded resume.`
      ],
      liveUrl: "",
      githubUrl: ""
    };
  }

  const project = (item || {}) as Record<string, unknown>;
  const name = firstText(project.name, project.projectName, project.title, "Project");
  const techStack = uniqueStrings([
    ...toArray(project.techStack || project.technologies || project.tech || project.stack),
    ...fallbackSkills.slice(0, 4)
  ]).slice(0, 8);
  const details = uniqueStrings([
    ...toArray(project.bullets || project.bulletPoints || project.keyFeatures || project.features),
    firstText(project.description, project.summary, project.impact, project.details)
  ]);
  const bullets = details.length
    ? details.map((detail) => `Developed ${name}${techStack.length ? ` with ${techStack.join(", ")}` : ""}, delivering ${detail}.`).slice(0, 3)
    : [`Built ${name}${techStack.length ? ` using ${techStack.join(", ")}` : ""}, demonstrating practical project ownership from the uploaded resume.`];

  return {
    name,
    techStack,
    bullets,
    liveUrl: firstText(project.liveUrl, project.demoUrl, project.liveDemoLink, project.url),
    githubUrl: firstText(project.githubUrl, project.github, project.repoUrl, project.repositoryUrl, project.sourceUrl)
  };
}

function normalizeWorldClassExperience(item: unknown) {
  if (typeof item === "string") {
    const line = cleanText(item);
    return { role: line, company: "", duration: "", location: "", bullets: line ? [`Contributed to ${line} with structured execution and clear ownership.`] : [] };
  }
  const exp = (item || {}) as Record<string, unknown>;
  const role = firstText(exp.role, exp.title, exp.position);
  const company = firstText(exp.company, exp.employer, exp.organization);
  const details = uniqueStrings([
    ...toArray(exp.bullets || exp.bulletPoints || exp.achievements),
    firstText(exp.description, exp.summary, exp.details)
  ]);
  return {
    role,
    company,
    duration: firstText(exp.duration, exp.dates, exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : exp.startDate),
    location: firstText(exp.location),
    bullets: details.map((detail) => `Delivered ${detail}${role || company ? ` as ${[role, company].filter(Boolean).join(" at ")}` : ""}.`).slice(0, 3)
  };
}

function normalizeWorldClassEducation(item: unknown) {
  if (typeof item === "string") {
    return { degree: cleanText(item), institution: "", duration: "", cgpa: "", details: "" };
  }
  const edu = (item || {}) as Record<string, unknown>;
  return {
    degree: firstText(edu.degree, edu.course, edu.qualification),
    institution: firstText(edu.institution, edu.college, edu.school, edu.university),
    duration: firstText(edu.duration, edu.years, edu.graduationYear, edu.year),
    cgpa: firstText(edu.cgpa, edu.gpa, edu.marks),
    details: firstText(edu.field, edu.major, edu.specialization, edu.details)
  };
}

function deriveWorldClassTitle(skills: string[], fallback = "Software Developer") {
  const joined = skills.join(" ").toLowerCase();
  if (/(react|node|express|mongodb|mern)/.test(joined)) return "Full Stack Developer | MERN Stack";
  if (/react|next|frontend|tailwind/.test(joined)) return "Frontend Developer";
  if (/node|express|backend|api/.test(joined)) return "Backend Developer";
  return fallback;
}

function getWorldClassResumeFallback(context: any) {
  const resume = context?.resume || {};
  const parsed = resume.parsedData || context?.parsedData || resume.content || {};
  const rawText = cleanText(resume.rawText || context?.rawText || "");
  const skills = uniqueStrings([
    ...toArray(parsed.skills),
    ...(rawText.match(/\b(React\.?js|Next\.?js|TypeScript|JavaScript|Node\.?js|Express\.?js|MongoDB|Mongoose|REST APIs?|JWT|Tailwind CSS|GitHub|Git|Postman|Vercel|Render|DSA|Data Structures)\b/gi) || [])
  ]);
  const title = firstText(context?.targetRole, parsed.title, parsed.role, deriveWorldClassTitle(skills));
  const projects = toArray(parsed.projects).map((project) => normalizeWorldClassProject(project, skills)).filter((project) => project.name);
  const experience = toArray(parsed.experience).map(normalizeWorldClassExperience).filter((exp) => exp.role || exp.company || exp.bullets.length);
  const education = toArray(parsed.education).map(normalizeWorldClassEducation).filter((edu) => edu.degree || edu.institution);
  const certifications = uniqueStrings(toArray(parsed.certifications));
  const summaryBase = firstText(parsed.summary, rawText.split(/\n/).slice(0, 3).join(" "));
  const summary = summaryBase
    ? `${summaryBase} Positioned for ${title} roles with ATS-aligned keywords and project-focused proof.`
    : `${title} with hands-on skills in ${skills.slice(0, 6).join(", ") || "software development"}. Focused on clean implementation, practical projects, and continuous learning.`;

  return {
    name: firstText(parsed.name, "Candidate"),
    title,
    contact: {
      email: firstText(parsed.email),
      phone: firstText(parsed.phone),
      github: firstText(parsed.github, parsed.githubUrl, linkMatching(parsed.links, /github/i)),
      linkedin: firstText(parsed.linkedin, parsed.linkedinUrl, linkMatching(parsed.links, /linkedin/i)),
      location: firstText(parsed.location)
    },
    summary,
    skills: categorizeWorldClassSkills(skills),
    projects,
    experience,
    education,
    certifications,
    atsKeywords: skills.slice(0, 20),
    formattingNotes: [
      "ATS-safe section order: Summary, Skills, Projects, Experience, Education, Certifications.",
      "Content uses only parsed resume data and avoids unsupported claims or fake metrics."
    ]
  };
}

export function getDeterministicKitFallback(context: any) {
  const tone = context.tone || "Professional";
  const jobTitle = context.job?.title || "Full Stack Developer";
  const company = context.job?.company || "Target Company";
  const matchingSkills = context.matchingSkills && context.matchingSkills.length > 0 ? context.matchingSkills : ["React", "Node.js", "MongoDB"];
  const skillsStr = matchingSkills.slice(0, 3).join(", ");

  let coverLetter = "";
  let hrEmail = "";
  let linkedinMessage = "";
  let whatsappMessage = "";
  let referralMessage = "";
  let salaryAnswer = "";
  let whyHireYouAnswer = "";
  let tellMeAboutYourselfAnswer = "";
  let whyCompanyAnswer = "";
  let noticePeriodAnswer = "";
  let workAuthorizationAnswer = "";
  let assignmentSubmissionAnswer = "";
  let followUpMessageAnswer = "";
  let rejectionResponseAnswer = "";
  let interviewConfirmationAnswer = "";

  if (tone === "Fresher-friendly") {
    whyHireYouAnswer = `As an enthusiastic graduate with projects using ${skillsStr}, I am eager to apply my knowledge to this ${jobTitle} role. I learn fast and want to contribute to the team's success.`;
    whyCompanyAnswer = `I admire ${company}'s focus on innovation and community. As a fresher, working at a company with your values and scale is my ideal environment to grow.`;
    tellMeAboutYourselfAnswer = `I am a junior developer passionate about technology. I built practical projects using ${skillsStr} and love solving logical puzzles. I am looking for my first professional role to learn and deliver value.`;
    salaryAnswer = `I am open to the standard fresher or entry-level salary package for this role. Learning and growth opportunities are my primary focus.`;
    noticePeriodAnswer = `I am a fresher and can start immediately. I have no notice period or prior commitments.`;
    workAuthorizationAnswer = `I am fully authorized to work in this location and do not require any visa sponsorship.`;
    assignmentSubmissionAnswer = `Here is my completed coding assignment for the ${jobTitle} position at ${company}. I focused on clean code, structured APIs, and clear comments. Please review.`;
    followUpMessageAnswer = `Hi, I wanted to politely follow up on my application for the ${jobTitle} role. I'd love to learn if there are any next steps. Thank you!`;
    rejectionResponseAnswer = `Thank you for the update. Although disappointed, I appreciate the feedback and hope we can connect for future junior opportunities at ${company}.`;
    interviewConfirmationAnswer = `Thank you for the invitation. I confirm my attendance for the interview on the proposed date and look forward to speaking with the team.`;
    coverLetter = `Dear Hiring Team,\n\nI am writing to express my interest in the ${jobTitle} position at ${company}. As an entry-level developer skilled in ${skillsStr}, I am excited about the opportunity to grow with your team. I look forward to discussing my project work.`;
    hrEmail = `Subject: Application for ${jobTitle} - Entry Level\n\nHi,\n\nI have applied for the ${jobTitle} position. I have built several projects using ${skillsStr} and would love to schedule an introductory call.`;
    linkedinMessage = `Hi, I noticed the ${jobTitle} opening at ${company}. I'm an entry-level developer with ${skillsStr} project experience and would love to learn more about the team's engineering culture.`;
    whatsappMessage = `Hi, I applied for the ${jobTitle} role at ${company}! My project stack matches your requirements, and I can start immediately.`;
    referralMessage = `Hi, I see a ${jobTitle} open at ${company}. With my background in ${skillsStr}, I believe I'd be a great junior fit. Would you be open to referring me?`;
  } else if (tone === "Technical") {
    whyHireYouAnswer = `My hands-on experience with ${skillsStr} aligns perfectly with your technology stack. I focus on backend optimization, robust API design, and component reusability.`;
    whyCompanyAnswer = `I want to work at ${company} because of your engineering challenges, particularly how you handle scaling and technical architecture. My background in ${skillsStr} fits your stack.`;
    tellMeAboutYourselfAnswer = `I am a software engineer specializing in web development. I focus on ${skillsStr}, asynchronous workflows, and database schema performance. I build highly optimized web systems.`;
    salaryAnswer = `Based on my technical capabilities and market rates for ${skillsStr} engineers, I am targeting a fair salary within the standard range.`;
    noticePeriodAnswer = `My notice period is standard, but I am open to negotiation or early release depending on project handovers.`;
    workAuthorizationAnswer = `I possess complete work authorization and do not require sponsorship for this role.`;
    assignmentSubmissionAnswer = `The assignment is complete. I structured it using modular architecture, verified API endpoints, and included unit tests. You can review the code details in the attached repository.`;
    followUpMessageAnswer = `Hi, following up on the technical assessment for ${jobTitle}. Let me know if the engineering team has any questions regarding my implementation.`;
    rejectionResponseAnswer = `Thank you for the feedback. I appreciate the technical review and hope to stay in touch for future engineering openings at ${company}.`;
    interviewConfirmationAnswer = `Confirmed. I look forward to the technical discussion and architecture review for the ${jobTitle} role.`;
    coverLetter = `Dear Hiring Team,\n\nMy technical background in ${skillsStr} makes me a strong fit for the ${jobTitle} role at ${company}. I design modular APIs, secure endpoints, and responsive user interfaces.`;
    hrEmail = `Subject: Application for ${jobTitle} - Technical Stack\n\nHi,\n\nI have applied for the ${jobTitle} role. With hands-on experience in ${skillsStr}, I am prepared for the technical challenges of your team.`;
    linkedinMessage = `Hi, I applied for the ${jobTitle} role at ${company}. I have worked with ${skillsStr} and would love to discuss the technical roadmap of your team.`;
    whatsappMessage = `Hi, I've submitted my application for ${jobTitle}. I have hands-on experience with ${skillsStr} and look forward to the technical stage.`;
    referralMessage = `Hi, I am applying for the ${jobTitle} opening. I have built production-grade systems using ${skillsStr} and would appreciate a referral to the engineering team.`;
  } else if (tone === "Confident") {
    whyHireYouAnswer = `I bring a proven track record of building applications using ${skillsStr}. I don't just write code; I solve business problems and deliver robust systems on schedule.`;
    whyCompanyAnswer = `${company} is leading the industry, and I want to contribute my skills to your team. I thrive in high-performing environments where we build excellent products.`;
    tellMeAboutYourselfAnswer = `I am a driven software developer who loves building products. I have experience with ${skillsStr} and a history of taking features from conception to production successfully.`;
    salaryAnswer = `My salary expectation is in line with my experience and the high value I will bring to the ${jobTitle} position at ${company}.`;
    noticePeriodAnswer = `I am ready to transition and can align my start date to meet the project's critical path.`;
    workAuthorizationAnswer = `I am fully authorized to work locally and require no visa sponsorship.`;
    assignmentSubmissionAnswer = `I have completed the technical assignment. It meets all the core and bonus requirements, featuring scalable architecture and solid performance.`;
    followUpMessageAnswer = `Hi, I am following up on the ${jobTitle} position. I am confident my background in ${skillsStr} matches your needs and would love to schedule the next interview.`;
    rejectionResponseAnswer = `Thank you for letting me know. I respect your decision and wish ${company} the best. Let's keep in touch as my profile continues to evolve.`;
    interviewConfirmationAnswer = `Thank you. I have confirmed the interview. I am excited to demonstrate how I can drive success for the ${jobTitle} team.`;
    coverLetter = `Dear Hiring Team,\n\nI am confident that my experience with ${skillsStr} makes me an exceptional candidate for the ${jobTitle} role at ${company}. I look forward to showing how I can add immediate value.`;
    hrEmail = `Subject: Candidate for ${jobTitle} - Confident Match\n\nHi,\n\nI'm reaching out regarding my application for the ${jobTitle} role. I have a strong skill set in ${skillsStr} and look forward to discussing how I can contribute.`;
    linkedinMessage = `Hi, I applied for the ${jobTitle} opening. I have a solid track record with ${skillsStr} and would love to connect with the hiring manager.`;
    whatsappMessage = `Hi! I applied for the ${jobTitle} role. My experience in ${skillsStr} is a great match, and I'd love to share my portfolio.`;
    referralMessage = `Hi, I'm looking to apply for ${jobTitle} at ${company}. I am confident my experience with ${skillsStr} makes me a strong fit. Would you refer me?`;
  } else if (tone === "Polite follow-up") {
    whyHireYouAnswer = `I believe my collaborative nature and technical skills in ${skillsStr} make me a reliable fit for the team. I focus on team goals and constant improvement.`;
    whyCompanyAnswer = `I appreciate ${company}'s work culture and customer focus. I would be honored to contribute my skills in ${skillsStr} to a team that values quality.`;
    tellMeAboutYourselfAnswer = `I am a developer who values teamwork and clean code. I have experience with ${skillsStr} and enjoy collaborating to build meaningful applications.`;
    salaryAnswer = `I am open to discussing salary to reach a mutually agreeable package that reflects the role's scope.`;
    noticePeriodAnswer = `I will coordinate with my current team to ensure a smooth transition with standard notice.`;
    workAuthorizationAnswer = `I am authorized to work and do not require sponsorship.`;
    assignmentSubmissionAnswer = `I have completed the assignment for your review. Thank you for the opportunity to work on this challenge; I welcome any feedback.`;
    followUpMessageAnswer = `Dear Hiring Team, I hope you are well. I wanted to politely follow up on my application for the ${jobTitle} role. Please let me know if you need any further information.`;
    rejectionResponseAnswer = `Thank you for the update. I appreciate the team's time and consideration, and would welcome future opportunities to connect with ${company}.`;
    interviewConfirmationAnswer = `Thank you for scheduling the interview. I am pleased to confirm my availability and look forward to our conversation.`;
    coverLetter = `Dear Hiring Team,\n\nI am writing to politely follow up and express my continued interest in the ${jobTitle} role. My background in ${skillsStr} matches the position requirements well.`;
    hrEmail = `Subject: Polite Follow-up: ${jobTitle} Application\n\nHi,\n\nI wanted to follow up on my application for ${jobTitle}. I remain highly interested and would appreciate a brief call.`;
    linkedinMessage = `Hi, I wanted to politely follow up on the ${jobTitle} role. I'd love to share how my background in ${skillsStr} can support the team.`;
    whatsappMessage = `Hi, just following up on my application for the ${jobTitle} role. Please let me know if you need any additional details.`;
    referralMessage = `Hi, I'm following up on my interest in the ${jobTitle} role. If you are comfortable, I'd appreciate it if you could share my profile with the team.`;
  } else if (tone === "Short recruiter DM") {
    whyHireYouAnswer = `I have solid hands-on experience with ${skillsStr} and a history of fast delivery.`;
    whyCompanyAnswer = `I respect ${company}'s product and engineering direction.`;
    tellMeAboutYourselfAnswer = `I'm a software developer experienced in ${skillsStr}, focusing on clean APIs and responsive UI.`;
    salaryAnswer = `Open to discussion based on total compensation and role requirements.`;
    noticePeriodAnswer = `Negotiable / can start quickly.`;
    workAuthorizationAnswer = `Authorized to work locally, no sponsorship needed.`;
    assignmentSubmissionAnswer = `Assignment is complete. Here is the link to review.`;
    followUpMessageAnswer = `Hi! Hope you're well. Just following up on the ${jobTitle} role. I'm highly interested and would love a quick chat.`;
    rejectionResponseAnswer = `Thanks for the update. Let's stay in touch for future roles.`;
    interviewConfirmationAnswer = `Confirming the interview time. Talk soon!`;
    coverLetter = `Hi Hiring Team,\n\nI'm a developer skilled in ${skillsStr} interested in the ${jobTitle} role. I look forward to discussing how I can help.`;
    hrEmail = `Subject: ${jobTitle} candidate: ${skillsStr}\n\nHi,\n\nInterested in the ${jobTitle} role. Experienced in ${skillsStr}. Let's chat.`;
    linkedinMessage = `Hi! I see you're hiring a ${jobTitle}. I'm experienced in ${skillsStr} and applied. I'd love to connect.`;
    whatsappMessage = `Hi! Just wanted to share my resume for the ${jobTitle} opening. I have experience in ${skillsStr}.`;
    referralMessage = `Hi, could you refer me for the ${jobTitle} role? I have experience in ${skillsStr} and believe I'm a strong match.`;
  } else if (tone === "Formal email") {
    whyHireYouAnswer = `I offer professional expertise in ${skillsStr} and a commitment to structured software engineering. My capabilities align with the core requirements of this position.`;
    whyCompanyAnswer = `I am highly motivated to join ${company} due to your leading position in the sector and my alignment with your corporate mission.`;
    tellMeAboutYourselfAnswer = `I am a professional software developer with a background in engineering systems using ${skillsStr}. My focus is on writing clean, maintainable code and collaborating effectively.`;
    salaryAnswer = `My salary expectations are aligned with standard market rates for a qualified engineer with my background.`;
    noticePeriodAnswer = `I am prepared to fulfill my contractual notice period while ensuring a comprehensive transition.`;
    workAuthorizationAnswer = `I possess full legal authorization to work in the country and do not require visa sponsorship.`;
    assignmentSubmissionAnswer = `Please find attached my submission for the technical assessment of the ${jobTitle} position. I have detailed my implementation and architecture in the documentation.`;
    followUpMessageAnswer = `Dear Recruiter,\n\nI am writing to inquire about the status of my application for the ${jobTitle} position. I remain very interested and look forward to your response.`;
    rejectionResponseAnswer = `Dear Team,\n\nThank you for informing me of your decision. While disappointed, I appreciate your time and hope to be considered for future openings.`;
    interviewConfirmationAnswer = `Dear Team,\n\nI am writing to confirm my attendance at the scheduled interview. I look forward to discussing the opportunity in detail.`;
    coverLetter = `Dear Hiring Manager,\n\nI am writing to formally apply for the ${jobTitle} position at ${company}. With my background in ${skillsStr}, I am confident in my ability to contribute to your organization.`;
    hrEmail = `Subject: Formal Application: ${jobTitle}\n\nDear Recruiter,\n\nI have submitted my application for the ${jobTitle} position. Please find my credentials attached.`;
    linkedinMessage = `Dear Hiring Manager, I have applied for the ${jobTitle} position. I would be pleased to connect and discuss my qualifications in ${skillsStr}.`;
    whatsappMessage = `Hello, I have submitted my formal application for the ${jobTitle} position. I look forward to the next stages of the process.`;
    referralMessage = `Dear Colleague, I am interested in applying for the ${jobTitle} position. Given my background in ${skillsStr}, I would be grateful for a referral.`;
  } else {
    whyHireYouAnswer = `I bring a strong foundation in ${skillsStr} and practical experience building web applications. I focus on clean code, reliability, and helping the team achieve its sprint goals.`;
    whyCompanyAnswer = `I'm drawn to ${company} because of your focus on product quality and engineering excellence. I want to build products that solve real problems.`;
    tellMeAboutYourselfAnswer = `I am a full-stack developer experienced in building web applications. I work with ${skillsStr} and enjoy solving API integration and responsive UI challenges.`;
    salaryAnswer = `I am seeking a salary that is competitive and aligned with the responsibilities of the role and my technical skill set.`;
    noticePeriodAnswer = `My notice period is standard, but I am open to coordinating an early release if required by the project schedule.`;
    workAuthorizationAnswer = `I am authorized to work and require no sponsorship now or in the future.`;
    assignmentSubmissionAnswer = `I have completed the technical assignment. The submission contains the implementation, test coverage, and documentation for your review.`;
    followUpMessageAnswer = `Hi, I wanted to follow up on my application for the ${jobTitle} position. Please let me know if you need any further information or references.`;
    rejectionResponseAnswer = `Thank you for letting me know. I appreciate the opportunity to interview and hope we can keep in touch for future roles.`;
    interviewConfirmationAnswer = `Thank you for the invitation. I am happy to confirm my availability for the interview at the proposed time.`;
    coverLetter = `Dear Hiring Team,\n\nI am writing to apply for the ${jobTitle} position at ${company}. With my skills in ${skillsStr}, I am confident I can contribute to building high-quality web applications.`;
    hrEmail = `Subject: Application for ${jobTitle} - Full Stack Developer\n\nHi,\n\nI have applied for the ${jobTitle} position. I have experience working with ${skillsStr} and would welcome the opportunity to discuss my qualifications.`;
    linkedinMessage = `Hi, I recently applied for the ${jobTitle} position at ${company}. I have experience in ${skillsStr} and wanted to connect with your team.`;
    whatsappMessage = `Hi, I've applied for the ${jobTitle} role. My experience in ${skillsStr} matches the requirements, and I would love to connect.`;
    referralMessage = `Hi, I am planning to apply for the ${jobTitle} role at ${company}. With my background in ${skillsStr}, I'd appreciate it if you could refer me.`;
  }

  return {
    coverLetter,
    hrEmail,
    linkedinMessage,
    whatsappMessage,
    referralMessage,
    salaryAnswer,
    whyHireYouAnswer,
    tellMeAboutYourselfAnswer,
    whyCompanyAnswer,
    noticePeriodAnswer,
    workAuthorizationAnswer,
    assignmentSubmissionAnswer,
    followUpMessageAnswer,
    rejectionResponseAnswer,
    interviewConfirmationAnswer,
    interviewPrepPlan: [
      `Review core requirements for ${jobTitle}`,
      `Revise project architecture using ${skillsStr}`,
      `Prepare company-specific context for ${company}`,
      `Practice mock behavioral interview questions`
    ]
  };
}

const interviewPrepFallback = {
  technicalTopics: ["JavaScript", "React hooks", "Node.js APIs", "MongoDB schemas", "Authentication"],
  technicalQuestions: ["Explain useEffect dependencies.", "How do you secure a JWT-based API?", "How do you design a MongoDB schema for applications?"],
  hrQuestions: ["Tell me about yourself.", "Why this company?", "Describe a project challenge."],
  projectQuestions: ["What problem did your project solve?", "How did you structure the backend?", "What would you improve?"],
  codingQuestions: ["Two sum", "Debounced search", "Array grouping"],
  systemDesignQuestions: ["Design a job application tracker for freshers."],
  companyResearch: ["Read the product pages", "Understand customer segment", "Prepare two thoughtful questions"],
  finalPreparationPlan: ["Day 1: revise resume", "Day 2: projects", "Day 3: mock interview", "Day 4: company-specific practice"]
};

const mockInterviewFallback = {
  score: { confidence: 8, technicalAccuracy: 7, communication: 9, completeness: 7, projectClarity: 8 },
  feedback: "Good structure. Add one concrete project example and explain tradeoffs more clearly.",
  improvedAnswer: "A stronger answer starts with the result, explains your specific responsibility, then mentions the technical decisions and impact.",
  nextQuestion: "Walk me through the architecture of your strongest full-stack project."
};

const interviewCoachFallback = {
  readinessScore: 72,
  focusAreas: ["Project explanation", "JavaScript fundamentals", "API design", "Concise HR answers"],
  practicePlan: ["Practice one project story using problem-action-result.", "Revise React hooks and Node API basics.", "Solve two easy DSA problems aloud.", "Record one mock HR answer."],
  projectQuestions: ["Why did you build this project?", "What was your exact contribution?", "How would you improve the architecture?"],
  hrQuestions: ["Tell me about yourself.", "Why should we hire you?", "How do you handle feedback?"],
  dsaQuestions: ["Explain two sum.", "Find duplicates in an array.", "Reverse words in a string."]
};

const skillGapFallback = {
  targetRole: "Full Stack Developer",
  missingSkills: ["Docker", "AWS basics", "Testing"],
  prioritySkills: ["TypeScript", "REST API design", "Authentication", "Testing"],
  sevenDayPlan: ["Revise JS fundamentals", "Build one auth API", "Add tests", "Deploy one project", "Practice React hooks", "Mock interview", "Apply to five tailored jobs"],
  thirtyDayPlan: ["Week 1 fundamentals", "Week 2 backend depth", "Week 3 deployment and testing", "Week 4 interview and applications"],
  projectSuggestions: ["Job tracker dashboard", "Role-based auth app", "Portfolio with case studies"]
};

const scamFallback = {
  trustScore: 42,
  riskLevel: "High",
  redFlags: ["Personal email used by recruiter", "Unrealistic salary promise", "Payment or registration fee mentioned"],
  recommendation: "Avoid applying until the company and recruiter identity are verified."
};

const rejectionFallback = {
  likelyReason: "Resume and project examples may not have matched the job keywords closely enough.",
  improvementPlan: ["Tailor resume before applying", "Add missing role keywords truthfully", "Practice project explanation"],
  resumeChanges: ["Tighten summary", "Add measurable project outcomes", "Move strongest skills higher"],
  interviewTopics: ["React fundamentals", "API design", "database modeling"],
  nextActions: ["Improve resume version", "Apply to 5 better-matched roles", "Schedule a mock interview"]
};

async function track(userId: string | undefined, feature: string, meta: AiCallMeta, guardrails: GuardrailResult) {
  await createRecord("aiRequests", {
    userId,
    feature,
    model: `${meta.provider}:${meta.model}`,
    provider: meta.provider,
    inputTokens: meta.inputTokens,
    outputTokens: meta.outputTokens,
    status: meta.status,
    error: meta.error || "",
    latencyMs: meta.latencyMs,
    fallbackUsed: meta.fallbackUsed,
    validationPassed: meta.validationPassed,
    safetyFlags: guardrails.safetyFlags,
    promptChars: guardrails.finalChars,
    privacyMode: "no_raw_prompt_storage"
  });
}

async function run<T>(userId: string | undefined, feature: string, prompt: string, fallback: T, schema?: ZodSchema<T>) {
  if (userId) {
    const limit = await checkAiCreditLimit(userId, feature);
    if (!limit.allowed) throw new ApiError(402, "AI credit limit reached", limit);
  }
  const guardedPrompt = buildGuardedPrompt(feature, prompt);
  const result = await callJsonModelWithMeta(guardedPrompt.prompt, fallback, schema);
  await track(userId, feature, result.meta, guardedPrompt);
  await recordUsageEvent(userId, feature, Math.max(1, Math.ceil((result.meta.inputTokens + result.meta.outputTokens) / 1000)), "ai", {
    provider: result.meta.provider,
    status: result.meta.status,
    fallbackUsed: result.meta.fallbackUsed
  });
  return result.data;
}

export const aiService = {
  status: () => {
    const runtime = getAiRuntime();
    return {
      provider: runtime.provider,
      model: runtime.model,
      timeoutMs: runtime.timeoutMs,
      retryAttempts: runtime.retryAttempts,
      fallbackEnabled: true,
      providerConfigured: runtime.provider !== "mock",
      schemaValidation: "enabled",
      usageTracking: "enabled",
      privacyMode: "no raw prompt or provider secret storage",
      safety: getAiSafetyStatus()
    };
  },
  usage: (userId: string) => getUsageSummary(userId),
  analyzeResume: (userId: string | undefined, context: any) => run(userId, "resume-analysis", buildresumeAnalysisPrompt(context), resumeAnalysisFallback, resumeAnalysisOutputSchema),
  generateWorldClassResume: (userId: string | undefined, context: any) => run(userId, "world-class-resume", buildWorldClassResumePrompt(context), getWorldClassResumeFallback(context), worldClassResumeOutputSchema),
  matchJob: (userId: string | undefined, context: any) => run(userId, "job-match", buildjobMatchPrompt(context), jobMatchFallback, jobMatchOutputSchema),
  tailorResume: (userId: string | undefined, context: any) => run(userId, "tailor-resume", buildtailorResumePrompt(context), tailoredResumeFallback, tailoredResumeOutputSchema),
  generateApplicationKit: (userId: string | undefined, context: any) => run(userId, "application-kit", buildapplicationKitPrompt(context), getDeterministicKitFallback(context), applicationKitOutputSchema),
  coverLetter: (userId: string | undefined, context: any) => run(userId, "cover-letter", buildcoverLetterPrompt(context), { coverLetter: getDeterministicKitFallback(context).coverLetter }, looseObjectOutputSchema),
  interviewPrep: (userId: string | undefined, context: any) => run(userId, "interview-prep", buildinterviewPrepPrompt(context), interviewPrepFallback, interviewPrepOutputSchema),
  interviewCoach: (userId: string | undefined, context: any) => run(userId, "interview-coach", buildinterviewCoachPrompt(context), interviewCoachFallback, interviewCoachOutputSchema),
  mockInterview: (userId: string | undefined, context: any) => run(userId, "mock-interview", buildmockInterviewPrompt(context), mockInterviewFallback, mockInterviewOutputSchema),
  skillGap: (userId: string | undefined, context: any) => run(userId, "skill-gap", buildskillGapPrompt(context), skillGapFallback, skillGapOutputSchema),
  scamCheck: (userId: string | undefined, context: any) => run(userId, "scam-check", buildscamDetectorPrompt(context), scamFallback, scamDetectorOutputSchema),
  chat: (userId: string | undefined, context: any) => run(userId, "career-chat", buildcareerChatPrompt(context), { answer: "Based on your profile, focus on tailored applications, one strong resume version per role, and interview practice around your projects.", suggestedActions: ["Analyze resume", "Match jobs", "Practice interview"] }, looseObjectOutputSchema),
  rejectionAnalysis: (userId: string | undefined, context: any) => run(userId, "rejection-analysis", buildrejectionAnalysisPrompt(context), rejectionFallback, rejectionAnalysisOutputSchema),
  portfolioGenerator: (userId: string | undefined, context: any) => run(userId, "portfolio-generator", buildportfolioGeneratorPrompt(context), { hero: "Full-stack developer building practical web products", about: "I build responsive, API-driven applications with React, Node.js, Express, and MongoDB.", skills: ["React", "Node.js", "MongoDB"], projects: ["AI Job Copilot", "Airbnb clone", "Spotify clone"] }, looseObjectOutputSchema),
  linkedinOptimizer: (userId: string | undefined, context: any) => run(userId, "linkedin-optimizer", buildlinkedinOptimizerPrompt(context), { headline: "Full-stack Developer | React | Node.js | MongoDB", about: "Project-focused developer seeking entry-level software roles." }, looseObjectOutputSchema),
  followUpMessage: (userId: string | undefined, context: any) => run(userId, "follow-up-message", buildfollowUpPrompt(context), { message: "Hi, I wanted to politely follow up on my application. I remain interested in the role and would be happy to share any additional details." }, looseObjectOutputSchema),
  parseJobText: (userId: string | undefined, context: any) => run(userId, "job-parser", `Extract structured job details from the following raw job description text.
Format the output as a valid JSON object matching this schema:
{
  "title": "Job title or best estimate",
  "company": "Company name",
  "location": "location, e.g. city, Remote, Hybrid",
  "remoteType": "Remote" | "Hybrid" | "Onsite",
  "jobType": "Full-time" | "Internship" | "Contract" | "Part-time",
  "salaryMin": number | null,
  "salaryMax": number | null,
  "skillsRequired": ["skill1", "skill2"],
  "description": "brief summary",
  "responsibilities": ["resp1", "resp2"],
  "requirements": ["req1", "req2"],
  "applyUrl": "url if found"
}

Raw job text:
${context.text}`, context.fallback, looseObjectOutputSchema)
};
