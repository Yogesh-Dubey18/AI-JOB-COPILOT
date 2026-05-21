import mongoose from "mongoose";

export type CollectionName =
  | "users"
  | "profiles"
  | "resumes"
  | "resumeAnalyses"
  | "resumeVersions"
  | "jobs"
  | "jobMatches"
  | "tailoredResumes"
  | "applicationKits"
  | "applications"
  | "interviews"
  | "mockInterviews"
  | "learningPlans"
  | "portfolios"
  | "jobScamReports"
  | "chatSessions"
  | "notifications"
  | "notificationPreferences"
  | "analyticsSnapshots"
  | "aiRequests"
  | "feedback";

export type StoredRecord = Record<string, any> & {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
};

export const memory: Record<CollectionName, StoredRecord[]> = {
  users: [],
  profiles: [],
  resumes: [],
  resumeAnalyses: [],
  resumeVersions: [],
  jobs: [],
  jobMatches: [],
  tailoredResumes: [],
  applicationKits: [],
  applications: [],
  interviews: [],
  mockInterviews: [],
  learningPlans: [],
  portfolios: [],
  jobScamReports: [],
  chatSessions: [],
  notifications: [],
  notificationPreferences: [],
  analyticsSnapshots: [],
  aiRequests: [],
  feedback: []
};

export function makeId() {
  return new mongoose.Types.ObjectId().toString();
}

export function resetMemoryStore() {
  for (const key of Object.keys(memory) as CollectionName[]) {
    memory[key] = [];
  }
}
