import { FilterQuery, Model } from "mongoose";
import { isDbReady } from "../config/db.js";
import { UserModel } from "../models/User.js";
import { ProfileModel } from "../models/Profile.js";
import { ResumeModel } from "../models/Resume.js";
import { ResumeAnalysisModel } from "../models/ResumeAnalysis.js";
import { ResumeVersionModel } from "../models/ResumeVersion.js";
import { JobModel } from "../models/Job.js";
import { JobMatchModel } from "../models/JobMatch.js";
import { TailoredResumeModel } from "../models/TailoredResume.js";
import { ApplicationKitModel } from "../models/ApplicationKit.js";
import { ApplicationModel } from "../models/Application.js";
import { InterviewModel } from "../models/Interview.js";
import { MockInterviewModel } from "../models/MockInterview.js";
import { LearningPlanModel } from "../models/LearningPlan.js";
import { PortfolioModel } from "../models/Portfolio.js";
import { JobScamReportModel } from "../models/JobScamReport.js";
import { ChatSessionModel } from "../models/ChatSession.js";
import { NotificationModel } from "../models/Notification.js";
import { NotificationPreferenceModel } from "../models/NotificationPreference.js";
import { AnalyticsSnapshotModel } from "../models/AnalyticsSnapshot.js";
import { AIRequestModel } from "../models/AIRequest.js";
import { SubscriptionModel } from "../models/Subscription.js";
import { UsageEventModel } from "../models/UsageEvent.js";
import { AuditLogModel } from "../models/AuditLog.js";
import { FeedbackModel } from "../models/Feedback.js";
import { CollectionName, StoredRecord, makeId, memory } from "./memoryStore.js";

const modelMap: Record<CollectionName, Model<any>> = {
  users: UserModel,
  profiles: ProfileModel,
  resumes: ResumeModel,
  resumeAnalyses: ResumeAnalysisModel,
  resumeVersions: ResumeVersionModel,
  jobs: JobModel,
  jobMatches: JobMatchModel,
  tailoredResumes: TailoredResumeModel,
  applicationKits: ApplicationKitModel,
  applications: ApplicationModel,
  interviews: InterviewModel,
  mockInterviews: MockInterviewModel,
  learningPlans: LearningPlanModel,
  portfolios: PortfolioModel,
  jobScamReports: JobScamReportModel,
  chatSessions: ChatSessionModel,
  notifications: NotificationModel,
  notificationPreferences: NotificationPreferenceModel,
  analyticsSnapshots: AnalyticsSnapshotModel,
  aiRequests: AIRequestModel,
  subscriptions: SubscriptionModel,
  usageEvents: UsageEventModel,
  auditLogs: AuditLogModel,
  feedback: FeedbackModel
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function normalize(value: any) {
  if (value == null) return value;
  if (typeof value === "object" && "_id" in value) return String(value._id);
  return String(value);
}

function matches(doc: StoredRecord, filter: Record<string, any>) {
  return Object.entries(filter).every(([key, expected]) => {
    const actual = key.split(".").reduce((acc: any, part) => acc?.[part], doc);
    if (expected instanceof RegExp) return expected.test(String(actual || ""));
    if (expected && typeof expected === "object" && "$in" in expected) {
      return expected.$in.map(String).includes(String(actual));
    }
    if (expected && typeof expected === "object" && "$ne" in expected) {
      return String(actual) !== String(expected.$ne);
    }
    return normalize(actual) === normalize(expected);
  });
}

export async function createRecord(collection: CollectionName, data: Record<string, any>): Promise<any> {
  if (isDbReady()) {
    const doc = await modelMap[collection].create(data);
    return doc.toObject();
  }
  const now = new Date();
  const doc: StoredRecord = { ...data, _id: makeId(), createdAt: now, updatedAt: now };
  memory[collection].push(doc);
  return clone(doc);
}

export async function findRecords(collection: CollectionName, filter: Record<string, any> = {}, options: { limit?: number; skip?: number; sort?: Record<string, 1 | -1> } = {}): Promise<any[]> {
  if (isDbReady()) {
    let query = modelMap[collection].find(filter as FilterQuery<any>).lean();
    if (options.sort) query = query.sort(options.sort);
    if (options.skip) query = query.skip(options.skip);
    if (options.limit) query = query.limit(options.limit);
    return query;
  }
  let rows = memory[collection].filter((doc) => matches(doc, filter));
  if (options.sort) {
    const [[field, dir]] = Object.entries(options.sort);
    rows = rows.sort((a, b) => (a[field] > b[field] ? dir : -dir));
  }
  if (options.skip) rows = rows.slice(options.skip);
  if (options.limit) rows = rows.slice(0, options.limit);
  return clone(rows);
}

export async function findOneRecord(collection: CollectionName, filter: Record<string, any> = {}): Promise<any | null> {
  if (isDbReady()) {
    return modelMap[collection].findOne(filter as FilterQuery<any>).lean();
  }
  const row = memory[collection].find((doc) => matches(doc, filter));
  return row ? clone(row) : null;
}

export async function findRecordById(collection: CollectionName, id: string): Promise<any | null> {
  if (isDbReady()) {
    return modelMap[collection].findById(id).lean();
  }
  const row = memory[collection].find((doc) => String(doc._id) === String(id));
  return row ? clone(row) : null;
}

export async function updateRecord(collection: CollectionName, id: string, data: Record<string, any>): Promise<any | null> {
  if (isDbReady()) {
    return modelMap[collection].findByIdAndUpdate(id, data, { new: true }).lean();
  }
  const index = memory[collection].findIndex((doc) => String(doc._id) === String(id));
  if (index === -1) return null;
  memory[collection][index] = { ...memory[collection][index], ...data, updatedAt: new Date() };
  return clone(memory[collection][index]);
}

export async function deleteRecord(collection: CollectionName, id: string): Promise<any> {
  if (isDbReady()) {
    return modelMap[collection].findByIdAndDelete(id).lean();
  }
  const before = memory[collection].length;
  memory[collection] = memory[collection].filter((doc) => String(doc._id) !== String(id));
  return { deleted: before !== memory[collection].length };
}

export async function countRecords(collection: CollectionName, filter: Record<string, any> = {}): Promise<number> {
  if (isDbReady()) {
    return modelMap[collection].countDocuments(filter as FilterQuery<any>);
  }
  return memory[collection].filter((doc) => matches(doc, filter)).length;
}
