import { aiService } from "../ai/ai.service.js";
import { createRecord, findRecords, findRecordById, updateRecord } from "../utils/repository.js";
import { ApiError } from "../utils/ApiError.js";

// Curated fallback resources
export const CURATED_FALLBACK_RESOURCES = [
  { topic: "JavaScript", resource: "MDN Web Docs (developer.mozilla.org)", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript" },
  { topic: "React", resource: "React Documentation (react.dev)", url: "https://react.dev" },
  { topic: "Node.js", resource: "Node.js Documentation (nodejs.org)", url: "https://nodejs.org/en/docs" },
  { topic: "Express", resource: "ExpressJS Guide (expressjs.com)", url: "https://expressjs.com" },
  { topic: "MongoDB", resource: "MongoDB Official Manual (docs.mongodb.com)", url: "https://docs.mongodb.com/manual" },
  { topic: "SQL basics", resource: "W3Schools SQL Tutorial", url: "https://www.w3schools.com/sql" },
  { topic: "Git/GitHub", resource: "Pro Git Book (git-scm.com/book)", url: "https://git-scm.com/book/en/v2" },
  { topic: "Deployment", resource: "Render / Vercel / Netlify Quickstarts", url: "https://render.com/docs" },
  { topic: "DSA basics", resource: "NeetCode.io DSA Course", url: "https://neetcode.io" },
  { topic: "System design basics", resource: "System Design Primer by Donne Martin", url: "https://github.com/donnemartin/system-design-primer" },
  { topic: "HR/interview preparation", resource: "Tech Interview Handbook", url: "https://www.techinterviewhandbook.org" }
];

export async function generateSkillGap(userId: string, input: any) {
  let currentSkillsList: string[] = [];
  let targetRole = input.targetRole || "Full Stack Developer";
  let requiredSkillsList: string[] = [];

  // 1. Fetch resume parsed skills if resumeId provided
  if (input.resumeId) {
    const resume = await findRecordById("resumes", input.resumeId);
    if (resume && String(resume.userId) === userId) {
      if (resume.parsedData?.skills && Array.isArray(resume.parsedData.skills)) {
        currentSkillsList = [...resume.parsedData.skills];
      }
    }
  }

  // If user provided manual currentSkills, merge them
  if (input.currentSkills && Array.isArray(input.currentSkills)) {
    currentSkillsList = Array.from(new Set([...currentSkillsList, ...input.currentSkills]));
  }

  // 2. Fetch job required skills if jobId provided
  if (input.jobId) {
    const job = await findRecordById("jobs", input.jobId);
    if (job) {
      targetRole = job.title;
      if (job.skillsRequired && Array.isArray(job.skillsRequired)) {
        requiredSkillsList = [...job.skillsRequired];
      }
    }
  }

  // If user provided manual targetRole, use it
  if (input.targetRole) {
    targetRole = input.targetRole;
  }

  // Normalize lists
  currentSkillsList = currentSkillsList.map(s => s.trim()).filter(Boolean);
  requiredSkillsList = requiredSkillsList.map(s => s.trim()).filter(Boolean);

  // If no required skills extracted, use a fallback set based on target role keywords
  if (requiredSkillsList.length === 0) {
    if (/react|frontend|client/i.test(targetRole)) {
      requiredSkillsList = ["React", "JavaScript", "HTML", "CSS", "TypeScript", "Tailwind CSS"];
    } else if (/node|backend|server|api/i.test(targetRole)) {
      requiredSkillsList = ["Node.js", "Express", "MongoDB", "SQL basics", "REST API", "Git/GitHub"];
    } else {
      requiredSkillsList = ["React", "Node.js", "Express", "MongoDB", "JavaScript", "Git/GitHub", "Deployment"];
    }
  }

  // 3. Compare current and required skills to find gaps (case-insensitive check)
  const currentSkillsLower = currentSkillsList.map(s => s.toLowerCase());
  const missingSkills = requiredSkillsList.filter(s => !currentSkillsLower.includes(s.toLowerCase()));

  // If there are no missing skills but required skills exist, add some advanced topics as growth areas
  if (missingSkills.length === 0 && requiredSkillsList.length > 0) {
    missingSkills.push("System design basics", "Deployment", "Testing");
  }

  // AI service input structure
  const aiInput = {
    targetRole,
    currentSkills: currentSkillsList,
    requiredSkills: requiredSkillsList,
    missingSkills
  };

  // Call the AI model or get fallback roadmap
  const result = await aiService.skillGap(userId, aiInput);

  // Combine resources
  const plan = await createRecord("learningPlans", {
    userId,
    targetRole,
    missingSkills: result.missingSkills || missingSkills,
    prioritySkills: result.prioritySkills || missingSkills.slice(0, 3),
    sevenDayPlan: result.sevenDayPlan || [
      "Day 1: Revise programming language fundamentals",
      "Day 2: Build a small script focusing on key syntax",
      "Day 3: Study REST API architecture and endpoints",
      "Day 4: Implement basic authentication in a local project",
      "Day 5: Practice core data structure operations",
      "Day 6: Complete a mock interview prep session",
      "Day 7: Document learnings and apply to 3 jobs"
    ],
    thirtyDayPlan: result.thirtyDayPlan || [
      "Week 1: Foundations and Language Core Basics",
      "Week 2: Deep Dive into Backend Architecture & APIs",
      "Week 3: Advanced Testing, SQL/NoSQL Database Design, and Cloud Deployment",
      "Week 4: Real-world Portfolio Projects and Behavioral Interview Prep"
    ],
    projectSuggestions: result.projectSuggestions || [
      `${targetRole} Starter Project with Auth`,
      "Personal Career Operations Logbook",
      "Mock API server with full database validation"
    ],
    progress: 0
  });

  return {
    ...plan,
    fallbackResources: CURATED_FALLBACK_RESOURCES
  };
}

export async function listLearningPlans(userId: string) {
  const list = await findRecords("learningPlans", { userId }, { sort: { createdAt: -1 } });
  return list.map(plan => ({
    ...plan,
    fallbackResources: CURATED_FALLBACK_RESOURCES
  }));
}

export async function updateLearningPlan(userId: string, id: string, data: any) {
  const plan = await findRecordById("learningPlans", id);
  if (!plan || String(plan.userId) !== userId) {
    throw new ApiError(404, "Learning plan not found");
  }
  const updated = await updateRecord("learningPlans", id, data);
  return {
    ...updated,
    fallbackResources: CURATED_FALLBACK_RESOURCES
  };
}

