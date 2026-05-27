import { aiService } from "../ai/ai.service.js";
import { ApiError } from "../utils/ApiError.js";
import { createRecord, findRecordById, findRecords, updateRecord } from "../utils/repository.js";
import { createAnswerVault } from "./answer-vault.service.js";

// ============================================================
// INTERVIEW PREP MODES — 10 supported modes
// ============================================================
export const PREP_MODES = [
  { id: "hr",          label: "HR interview",                 icon: "👥" },
  { id: "technical",   label: "Technical interview",          icon: "⚙️" },
  { id: "react",       label: "React frontend interview",     icon: "⚛️" },
  { id: "node",        label: "Node/Express backend interview",icon: "🟩" },
  { id: "mern",        label: "MERN full stack interview",    icon: "🗂️" },
  { id: "javascript",  label: "JavaScript basics",            icon: "🟨" },
  { id: "project",     label: "Project explanation",          icon: "📂" },
  { id: "fresher",     label: "Fresher behavioral interview", icon: "🎓" },
  { id: "salary",      label: "Salary discussion",            icon: "💰" },
  { id: "assignment",  label: "Assignment discussion",        icon: "📝" }
];

// ============================================================
// QUESTION BANKS — deterministic fallback per mode
// ============================================================
const QUESTION_BANK: Record<string, { question: string; hint: string }[]> = {
  hr: [
    { question: "Tell me about yourself.", hint: "Use: Present role/background → key skills → why this company." },
    { question: "Why should we hire you?", hint: "Map 3 concrete skills/achievements to the job requirements." },
    { question: "Where do you see yourself in 5 years?", hint: "Align your growth goals with the company's direction." },
    { question: "What is your greatest strength?", hint: "Give one strength + a specific work example that proves it." },
    { question: "What is your greatest weakness?", hint: "Name a real weakness and show you are actively improving it." },
    { question: "Why are you leaving your current job?", hint: "Stay positive. Focus on growth, not frustration." },
    { question: "Tell me about a time you handled conflict at work.", hint: "Use STAR: Situation, Task, Action, Result." }
  ],
  technical: [
    { question: "Explain the difference between REST and GraphQL.", hint: "Cover data fetching, over-fetching, schema differences." },
    { question: "What is JWT and how does it work?", hint: "Header.Payload.Signature; stateless; expiry; refresh tokens." },
    { question: "How does API error handling work in Express?", hint: "Middleware error handler, next(err), status codes." },
    { question: "What is the difference between SQL and NoSQL?", hint: "Schema, scaling, ACID vs BASE, use cases." },
    { question: "How would you design a scalable upload service?", hint: "Discuss S3/R2, pre-signed URLs, chunking, queues." },
    { question: "Explain CORS and how to fix CORS errors.", hint: "Origin policy, preflight, Access-Control headers." }
  ],
  react: [
    { question: "Explain React hooks — useState, useEffect, useCallback.", hint: "State lifecycle, side effects, memoization." },
    { question: "What is the virtual DOM and how does React reconcile?", hint: "Diffing, key prop, fiber architecture basics." },
    { question: "How do you manage global state in a React app?", hint: "Context, React Query, Zustand, Redux Toolkit." },
    { question: "What is the difference between controlled and uncontrolled components?", hint: "ref vs useState, form handling." },
    { question: "How do you optimize React performance?", hint: "useMemo, useCallback, React.memo, lazy loading, code splitting." },
    { question: "Explain React Query and when you would use it.", hint: "Server-state caching, stale time, invalidation, mutations." }
  ],
  node: [
    { question: "What is the Node.js event loop?", hint: "Single thread, libuv, call stack, task queue, microtask queue." },
    { question: "Explain Express middleware with an example.", hint: "app.use(), next(), error middleware, order matters." },
    { question: "How does Node handle async I/O?", hint: "Non-blocking, callbacks, Promises, async/await, worker threads." },
    { question: "How do you secure an Express API?", hint: "Helmet, CORS, rate limiting, JWT, input validation, HTTPS." },
    { question: "What is the difference between process.nextTick and setImmediate?", hint: "Microtask vs macrotask queue timing." },
    { question: "How would you implement rate limiting in Node?", hint: "express-rate-limit, Redis sliding window, IP-based limits." }
  ],
  mern: [
    { question: "Walk me through a full MERN request cycle.", hint: "React → fetch → Express route → controller → Mongoose → DB → response → state update." },
    { question: "How do you manage authentication in a MERN app?", hint: "JWT, httpOnly cookies, refresh token rotation, middleware." },
    { question: "How do you structure a large MERN project?", hint: "Feature-based folders, shared types, env config, CI/CD." },
    { question: "Explain MongoDB aggregation pipelines.", hint: "$match, $group, $project, $lookup, $sort, $limit." },
    { question: "How do you handle file uploads in MERN?", hint: "Multer, S3 pre-signed URLs, multipart/form-data." }
  ],
  javascript: [
    { question: "Explain JavaScript Promises and async/await.", hint: "Promise states, .then/.catch/.finally, await resolves Promise." },
    { question: "What is closure in JavaScript?", hint: "Function retaining access to outer scope variable after outer function returns." },
    { question: "Explain event delegation.", hint: "Attach one listener to parent; check event.target; works for dynamic elements." },
    { question: "What is the difference between == and ===?", hint: "== coerces types; === is strict equality; always prefer ===." },
    { question: "Explain debounce and throttle.", hint: "Debounce: delay until quiet. Throttle: execute at fixed rate." },
    { question: "What is prototype chain / prototypal inheritance?", hint: "Object.__proto__, Object.create, class syntax sugar." }
  ],
  project: [
    { question: "Walk me through your most complex project.", hint: "Problem → Architecture → Your role → Key decisions → Result." },
    { question: "What was the biggest technical challenge you faced?", hint: "Describe the challenge, your thought process, and the outcome." },
    { question: "What tradeoffs did you make in your project design?", hint: "Performance vs readability, SQL vs NoSQL, monolith vs microservices." },
    { question: "How did you test your project?", hint: "Unit, integration, E2E; mocking; coverage; CI pipeline." },
    { question: "What would you improve in your project if you had more time?", hint: "Show critical thinking; focus on scalability, DX, or UX." }
  ],
  fresher: [
    { question: "Tell me about yourself as a fresher.", hint: "Degree → projects → skills → why this company." },
    { question: "What projects have you built during your studies?", hint: "Name 2-3; describe stack, your role, and outcome." },
    { question: "How do you handle working in a team?", hint: "Collaboration, communication, version control, standups." },
    { question: "Why do you want to work in software development?", hint: "Genuine motivation; specific skills you enjoy building." },
    { question: "How quickly can you learn new technologies?", hint: "Give a specific example of learning a new tool and using it." },
    { question: "What is your approach when you get stuck on a problem?", hint: "Break it down, search docs, ask after self-effort, document learnings." }
  ],
  salary: [
    { question: "What are your salary expectations?", hint: "Research market rate; give a range; anchor slightly high; be flexible." },
    { question: "Are you willing to negotiate?", hint: "Yes, professionally. Reference your value, not personal need." },
    { question: "What is your current CTC / compensation?", hint: "Be honest; mention fixed vs variable; mention equity if relevant." },
    { question: "What is your expected CTC?", hint: "State your range based on role, location, and your skill level." },
    { question: "Would you consider a lower offer for the right opportunity?", hint: "Redirect to total compensation: growth, learning, benefits." }
  ],
  assignment: [
    { question: "Walk me through your assignment submission.", hint: "Problem → approach → implementation → testing → improvements." },
    { question: "What assumptions did you make during the assignment?", hint: "List scope decisions; show you thought about edge cases." },
    { question: "What would you change about your assignment solution?", hint: "Show self-awareness; suggest specific improvements." },
    { question: "How did you structure your code for readability?", hint: "Discuss naming, file structure, comments, separation of concerns." },
    { question: "How did you test your assignment?", hint: "Manual testing, unit tests, edge cases, error scenarios." }
  ]
};

// ============================================================
// STAR TEMPLATES — per mode, per question category
// ============================================================
function buildStarTemplate(mode: string, question: string): {
  situation: string; task: string; action: string; result: string; polishedAnswer: string; isFallback: boolean
} {
  const modeLabel = PREP_MODES.find((m) => m.id === mode)?.label || mode;
  const base = {
    situation: `[Describe the specific context or challenge you faced relevant to: "${question}"]. e.g., "During my internship / project at [Company/University], we had a situation where...".`,
    task: `[Describe your specific responsibility or goal in that situation]. e.g., "My task was to design/build/fix [specific thing] within [timeframe]...".`,
    action: `[Describe the exact steps you took. Be specific about tools, frameworks, and decisions]. e.g., "I used [technology] to solve this by [steps]...".`,
    result: `[Describe the outcome with metrics if possible]. e.g., "The result was [specific improvement: performance, cost, user satisfaction, delivery date]...".`,
    polishedAnswer: `[Combine all four STAR sections into a fluent 2-3 minute answer. Practise speaking it aloud. Review before the interview.]

For the question: "${question}"
Prep mode: ${modeLabel}

Situation: [your situation]
Task: [your task]
Action: [your actions]
Result: [your result]

IMPORTANT: This is a template — fill in your real experience before using it. Do not present templates as real answers.`,
    isFallback: true
  };

  if (mode === "salary") {
    return {
      ...base,
      situation: "[Context: Research your market rate on LinkedIn Salary, Glassdoor, AmbitionBox for your role, experience level, and city.]",
      task: "[Your task: State a salary range that reflects your research, your value, and leaves room to negotiate.]",
      action: "[Say]: \"Based on my research and the skills I bring — [skill 1, skill 2, skill 3] — I am looking for a range between [X] and [Y] per annum. I am open to discussion based on the total compensation including benefits and growth opportunities.\"",
      result: "[Outcome: You open a professional negotiation and demonstrate market awareness. Do not anchor at your current salary alone.]",
      polishedAnswer: `Salary Template (fill in your own numbers before using):\n\n"Based on my research into market rates for a ${modeLabel} role in [city/remote] with [X] years of experience, I am looking for a range between [₹X LPA / $X] and [₹Y LPA / $Y]. I am open to discussion depending on the total package including learning opportunities, benefits, and growth trajectory."

DISCLAIMER: Review this template carefully. Adjust numbers to your actual research before using.`,
      isFallback: true
    };
  }

  return base;
}

// ============================================================
// INTERVIEW READINESS — heuristic score (no AI required)
// ============================================================
export async function getAdvancedInterviewReadiness(userId: string, jobId?: string, applicationId?: string) {
  const [resumes, vault, company, interviews, sessions] = await Promise.all([
    findRecords("resumes", { userId }, { limit: 5 }),
    findRecords("answerVault", { userId }, { limit: 20 }),
    findRecords("companyResearch", { userId }, { limit: 5 }),
    findRecords("interviews", { userId }, { limit: 10 }),
    findRecords("interviewSessions", { userId }, { limit: 10 })
  ]);

  const hasResume = resumes.length > 0;
  const hasJob = Boolean(jobId || applicationId || interviews.length > 0);
  const hasCompanyResearch = company.length > 0;
  const hasAnswerVault = vault.length >= 3;
  const hasSalaryAnswer = vault.some((v: any) => /salary|compensation|ctc|pay/i.test(v.question));
  const hasProjectAnswer = vault.some((v: any) => /project|built|created|developed/i.test(v.question));
  const hasMockPractice = sessions.length > 0;

  const scores: { label: string; score: number; done: boolean; advice: string }[] = [
    { label: "Resume uploaded",          score: hasResume ? 15 : 0,        done: hasResume,         advice: "Upload your resume first at /resume/upload" },
    { label: "Job/interview selected",   score: hasJob ? 15 : 0,           done: hasJob,            advice: "Add a job or interview to get context-specific tips" },
    { label: "Company researched",       score: hasCompanyResearch ? 15 : 0,done: hasCompanyResearch,advice: "Research your target company at /company-research" },
    { label: "Answer vault prepared",    score: hasAnswerVault ? 15 : 0,   done: hasAnswerVault,    advice: "Save at least 3 prepared answers to your Answer Vault" },
    { label: "Salary answer prepared",   score: hasSalaryAnswer ? 15 : 0,  done: hasSalaryAnswer,   advice: "Prepare a salary expectation answer using the Salary mode" },
    { label: "Project answer prepared",  score: hasProjectAnswer ? 15 : 0, done: hasProjectAnswer,  advice: "Prepare a project explanation answer using STAR builder" },
    { label: "Mock session completed",   score: hasMockPractice ? 10 : 0,  done: hasMockPractice,  advice: "Complete at least one mock interview session" }
  ];

  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const readinessLevel =
    totalScore >= 85 ? "Interview ready"
    : totalScore >= 65 ? "Almost ready — complete remaining steps"
    : totalScore >= 45 ? "In preparation — keep going"
    : "Just getting started";

  return {
    readinessScore: totalScore,
    readinessLevel,
    scores,
    disclaimer: "This score is a self-assessment heuristic only. It does not guarantee interview success. Use it to identify preparation gaps.",
    voiceNote: "Voice mock interview is provider-ready / future enhancement. Text mock interview is available now."
  };
}

// ============================================================
// PREP CONTEXT — job/company context for the prep workspace
// ============================================================
export async function getInterviewPrepContext(userId: string, jobId?: string, applicationId?: string) {
  const [jobs, applications, company] = await Promise.all([
    jobId ? findRecords("jobs", { _id: jobId }, { limit: 1 }) : Promise.resolve([]),
    applicationId ? findRecords("applications", { _id: applicationId, userId }, { limit: 1 }) : Promise.resolve([]),
    findRecords("companyResearch", { userId }, { sort: { createdAt: -1 }, limit: 1 })
  ]);

  const job = (jobs as any[])[0] || null;
  const application = (applications as any[])[0] || null;
  const research = (company as any[])[0] || null;

  if (!job && !application) {
    return {
      hasContext: false,
      message: "No job or application selected. Select or import a job to get context-specific preparation tips.",
      job: null,
      company: null,
      suggestedTopics: [],
      salaryNotes: []
    };
  }

  const title = job?.title || application?.role || "Target Role";
  const companyName = job?.company || application?.company || research?.company || "Target Company";
  const skills = job?.skillsRequired || [];

  const suggestedTopics = [
    `Research ${companyName}'s recent product updates and news`,
    `Prepare 2-3 STAR stories relevant to ${title}`,
    `Review the job description and map your projects to required skills`,
    `Prepare your salary range based on market research for ${title}`,
    ...(skills.length > 0 ? [`Revise: ${skills.slice(0, 3).join(", ")}`] : [])
  ];

  const salaryNotes = [
    `Research ${title} salaries on Glassdoor, LinkedIn, and AmbitionBox`,
    "Prepare a range, not a single number",
    "Consider total compensation: base, variable, equity, benefits"
  ];

  return {
    hasContext: true,
    job: { title, company: companyName, skills, applyUrl: job?.applyUrl || null },
    company: research ? { name: research.company, overview: research.overview, techStack: research.techStack } : null,
    suggestedTopics,
    salaryNotes
  };
}

// ============================================================
// STAR BUILDER API
// ============================================================
export function getStarTemplate(mode: string, question: string) {
  const modeExists = PREP_MODES.some((m) => m.id === mode);
  if (!mode || !question) throw new ApiError(400, "mode and question are required");
  const resolvedMode = modeExists ? mode : "hr";
  return buildStarTemplate(resolvedMode, question);
}

export async function saveStarAnswerToVault(userId: string, input: {
  question: string;
  answer: string;
  mode?: string;
}) {
  if (!input.question || !input.answer) throw new ApiError(400, "question and answer are required to save to vault");
  return createAnswerVault(userId, {
    question: input.question,
    answer: input.answer,
    category: `Interview Prep — ${input.mode || "General"}`,
    tags: ["interview", "star", input.mode || "general"].filter(Boolean)
  });
}

// ============================================================
// QUESTION BANK
// ============================================================
export function getPrepQuestionBank(mode: string) {
  const questions = QUESTION_BANK[mode] || QUESTION_BANK["hr"];
  return {
    mode,
    isFallback: true,
    label: "Fallback Template Mode — AI not configured",
    disclaimer: "These questions are deterministic templates. They represent common interview patterns but are not tailored to your specific application. Review all answers before your interview.",
    questions
  };
}

// ============================================================
// LEGACY FUNCTIONS (unchanged below — kept for backward compat)
// ============================================================
const questionBanks: Record<string, Record<string, string[]>> = {
  "full stack developer": {
    project: ["Walk me through your strongest full-stack project.", "How did you design authentication?", "What tradeoff did you make in the database schema?"],
    hr: ["Tell me about yourself.", "Why should we hire you?", "Describe a time you learned something quickly."],
    dsa: ["Explain two sum and its time complexity.", "Find the first non-repeating character.", "Merge two sorted arrays."],
    "system-design": ["Design a job application tracker.", "Design a resume upload and analysis workflow.", "How would you scale a notification system?"]
  },
  "frontend developer": {
    project: ["Explain your most interactive React component.", "How do you manage state and API loading?", "How do you make a UI responsive?"],
    hr: ["Why frontend development?", "How do you handle design feedback?", "How do you debug user-facing issues?"],
    dsa: ["Debounce a search input.", "Flatten a nested array.", "Group objects by key."],
    "system-design": ["Design a dashboard page.", "Design an accessible form flow.", "Design a frontend data-fetching strategy."]
  },
  "backend developer": {
    project: ["Explain your API design.", "How did you model data?", "How do you handle validation and errors?"],
    hr: ["Why backend development?", "How do you handle production issues?", "How do you communicate blockers?"],
    dsa: ["Implement rate limiter logic.", "Detect a cycle in linked list.", "Design an LRU cache."],
    "system-design": ["Design an auth service.", "Design a job import pipeline.", "Design a reminder scheduler."]
  }
};

function normalizeRole(role = "Full Stack Developer") {
  const key = role.toLowerCase();
  if (key.includes("front")) return "frontend developer";
  if (key.includes("back") || key.includes("node")) return "backend developer";
  return "full stack developer";
}

function getQuestions(role: string, focus = "mixed") {
  const bank = questionBanks[normalizeRole(role)] || questionBanks["full stack developer"];
  if (focus !== "mixed" && bank[focus]) return bank[focus];
  return [...bank.project, ...bank.hr, ...bank.dsa, ...bank["system-design"]];
}

function averageScore(scores: any[]) {
  const values = scores.flatMap((score) => Object.values(score || {}).filter((value) => typeof value === "number") as number[]);
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length * 10) : 0;
}

export function getQuestionBank(role = "Full Stack Developer") {
  const normalized = normalizeRole(role);
  return { role: normalized, ...questionBanks[normalized] };
}

export async function getInterviewReadiness(userId: string) {
  const [interviews, sessions, mocks, analyses] = await Promise.all([
    findRecords("interviews", { userId }),
    findRecords("interviewSessions", { userId }, { sort: { createdAt: -1 }, limit: 20 }),
    findRecords("mockInterviews", { userId }, { sort: { createdAt: -1 }, limit: 20 }),
    findRecords("resumeAnalyses", { userId }, { sort: { createdAt: -1 }, limit: 5 })
  ]);
  const scoreHistory = [...sessions.flatMap((session: any) => session.scoreHistory || []), ...mocks.map((mock: any) => mock.score).filter(Boolean)];
  const practiceScore = Math.min(100, (sessions.length + mocks.length) * 15);
  const scheduledScore = Math.min(100, interviews.length * 25);
  const mockScore = averageScore(scoreHistory);
  const resumeScore = analyses[0]?.atsScore || 0;
  const readinessScore = Math.round(practiceScore * 0.3 + scheduledScore * 0.2 + mockScore * 0.25 + resumeScore * 0.25);
  return {
    readinessScore,
    readinessLevel: readinessScore >= 80 ? "Interview ready" : readinessScore >= 60 ? "Practice focused" : readinessScore >= 40 ? "Needs mock practice" : "Start preparation",
    scoreBreakdown: { practiceScore, scheduledScore, mockScore, resumeScore },
    sessionsCompleted: sessions.filter((session: any) => session.status === "completed").length,
    activeSessions: sessions.filter((session: any) => session.status === "active").length,
    mockInterviews: mocks.length,
    scheduledInterviews: interviews.length,
    focusAreas: [
      mockScore < 70 ? "Improve answer structure and project clarity." : "",
      resumeScore < 80 ? "Revise resume points before interview storytelling." : "",
      sessions.length < 2 ? "Complete at least two focused practice sessions." : ""
    ].filter(Boolean),
    nextActions: [
      "Practice one project story using problem, action, result, and tradeoff.",
      "Answer two HR questions aloud and shorten rambling sections.",
      "Solve one DSA problem while explaining complexity."
    ]
  };
}

export async function startInterviewSession(userId: string, input: any) {
  const role = input.role || "Full Stack Developer";
  const focus = input.focus || "mixed";
  const questions = getQuestions(role, focus);
  return createRecord("interviewSessions", {
    userId,
    applicationId: input.applicationId,
    role,
    focus,
    status: "active",
    questions,
    currentQuestion: questions[0],
    nextQuestion: questions[1] || "",
    answers: [],
    scoreHistory: [],
    readinessScore: 0
  });
}

export async function answerInterviewSession(userId: string, input: any) {
  const session = await findRecordById("interviewSessions", input.sessionId);
  if (!session || String(session.userId) !== String(userId)) throw new ApiError(404, "Interview session not found");
  const question = session.currentQuestion || input.question;
  const result = await aiService.mockInterview(userId, { role: session.role, focus: session.focus, question, answer: input.answer });
  const answers = [...(session.answers || []), { question, answer: input.answer, score: result.score, feedback: result.feedback, improvedAnswer: result.improvedAnswer, createdAt: new Date() }];
  const scoreHistory = [...(session.scoreHistory || []), result.score];
  const nextQuestion = result.nextQuestion || session.questions?.[answers.length] || "";
  const readinessScore = averageScore(scoreHistory);
  return updateRecord("interviewSessions", String(session._id), {
    answers,
    scoreHistory,
    currentQuestion: nextQuestion,
    nextQuestion,
    readinessScore,
    status: nextQuestion ? "active" : "completed",
    summary: result.feedback
  });
}

export async function getInterviewHistory(userId: string) {
  const [sessions, mocks, interviews] = await Promise.all([
    findRecords("interviewSessions", { userId }, { sort: { createdAt: -1 }, limit: 50 }),
    findRecords("mockInterviews", { userId }, { sort: { createdAt: -1 }, limit: 50 }),
    findRecords("interviews", { userId }, { sort: { scheduledAt: -1 }, limit: 50 })
  ]);
  return { sessions, mocks, interviews };
}

export function getProjectCoach(role = "Full Stack Developer") {
  return {
    role,
    framework: ["Problem", "Your responsibility", "Architecture", "Tradeoffs", "Result", "What you would improve"],
    questions: getQuestions(role, "project")
  };
}

export function getHrCoach() {
  return {
    answerFramework: ["Short context", "Specific example", "Learning or result", "Connect to role"],
    questions: questionBanks["full stack developer"].hr
  };
}

export function getDsaTracker(role = "Full Stack Developer") {
  return {
    role,
    weeklyTarget: 10,
    categories: ["arrays", "strings", "hash maps", "two pointers", "recursion basics"],
    questions: getQuestions(role, "dsa")
  };
}
