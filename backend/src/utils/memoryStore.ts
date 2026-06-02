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
  | "interviewSessions"
  | "mockInterviews"
  | "learningPlans"
  | "portfolios"
  | "publicProfiles"
  | "portfolioFiles"
  | "portfolioFileAuditEvents"
  | "portfolioFileExportRequests"
  | "maintenanceRuns"
  | "pdfExports"
  | "jobScamReports"
  | "chatSessions"
  | "notifications"
  | "notificationPreferences"
  | "privacyPreferences"
  | "analyticsSnapshots"
  | "aiRequests"
  | "subscriptions"
  | "usageEvents"
  | "auditLogs"
  | "feedback"
  | "companyResearch"
  | "answerVault"
  | "careerVault"
  | "contacts"
  | "emailVerificationTokens"
  | "passwordResetTokens";

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
  interviewSessions: [],
  mockInterviews: [],
  learningPlans: [],
  portfolios: [],
  publicProfiles: [],
  portfolioFiles: [],
  portfolioFileAuditEvents: [],
  portfolioFileExportRequests: [],
  maintenanceRuns: [],
  pdfExports: [],
  jobScamReports: [],
  chatSessions: [],
  notifications: [],
  notificationPreferences: [],
  privacyPreferences: [],
  analyticsSnapshots: [],
  aiRequests: [],
  subscriptions: [],
  usageEvents: [],
  auditLogs: [],
  feedback: [],
  companyResearch: [],
  answerVault: [],
  careerVault: [],
  contacts: [],
  emailVerificationTokens: [],
  passwordResetTokens: []
};

export function makeId() {
  return new mongoose.Types.ObjectId().toString();
}

export function resetMemoryStore() {
  for (const key of Object.keys(memory) as CollectionName[]) {
    memory[key] = [];
  }
}
