import { aiService } from "../ai/ai.service.js";
import { ApiError } from "../utils/ApiError.js";
import { createRecord, findRecordById, findRecords, updateRecord } from "../utils/repository.js";

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
