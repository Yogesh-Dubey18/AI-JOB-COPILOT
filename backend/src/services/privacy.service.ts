import { ApiError } from "../utils/ApiError.js";
import { CollectionName } from "../utils/memoryStore.js";
import { createRecord, deleteRecord, deleteRecords, findOneRecord, findRecordById, findRecords, updateRecord } from "../utils/repository.js";

const defaultPrivacyPreferences = {
  allowAiTraining: false,
  shareProductAnalytics: false,
  emailDataExportUpdates: true,
  personalizationEnabled: true
};

const userOwnedCollections: CollectionName[] = [
  "profiles",
  "resumes",
  "resumeAnalyses",
  "resumeVersions",
  "jobMatches",
  "tailoredResumes",
  "applicationKits",
  "applications",
  "interviews",
  "mockInterviews",
  "learningPlans",
  "portfolios",
  "jobScamReports",
  "chatSessions",
  "notifications",
  "notificationPreferences",
  "privacyPreferences",
  "analyticsSnapshots",
  "aiRequests",
  "subscriptions",
  "usageEvents",
  "feedback"
];

function sanitizeUser(user: any) {
  if (!user) return null;
  const { passwordHash, refreshTokenHash, failedLoginAttempts, lockedUntil, ...safeUser } = user;
  return safeUser;
}

function pickBooleanPreferences(input: any) {
  return Object.fromEntries(
    Object.keys(defaultPrivacyPreferences)
      .filter((key) => typeof input?.[key] === "boolean")
      .map((key) => [key, input[key]])
  );
}

export async function getPrivacyPreferences(userId: string) {
  const existing = await findOneRecord("privacyPreferences", { userId });
  if (existing) return existing;
  return createRecord("privacyPreferences", { userId, ...defaultPrivacyPreferences });
}

export async function updatePrivacyPreferences(userId: string, input: any) {
  const existing = await getPrivacyPreferences(userId);
  return updateRecord("privacyPreferences", String(existing._id), {
    ...defaultPrivacyPreferences,
    ...existing,
    ...pickBooleanPreferences(input),
    userId
  });
}

export async function exportUserData(userId: string) {
  const user = await findRecordById("users", userId);
  if (!user) throw new ApiError(404, "User not found");
  const entries = await Promise.all(
    userOwnedCollections.map(async (collection) => [collection, await findRecords(collection, { userId })] as const)
  );
  const auditLogs = await findRecords("auditLogs", { actorUserId: userId }, { sort: { createdAt: -1 }, limit: 200 });
  return {
    exportedAt: new Date().toISOString(),
    formatVersion: "privacy-export-v2",
    user: sanitizeUser(user),
    data: Object.fromEntries(entries),
    retainedSecurityRecords: {
      auditLogs,
      note: "Security audit logs may be retained in minimized form for abuse prevention, support, and incident review."
    },
    notices: [
      "This export is generated from the currently configured database or local mock store.",
      "Secrets, password hashes, refresh token hashes, and provider credentials are intentionally excluded.",
      "AI outputs are advisory content saved for user review; provider raw prompts are not stored by the default implementation."
    ]
  };
}

export async function deleteAccount(userId: string, confirmation: string) {
  if (confirmation !== "DELETE MY ACCOUNT") {
    throw new ApiError(422, "Type DELETE MY ACCOUNT to confirm account deletion.");
  }
  const user = await findRecordById("users", userId);
  if (!user) throw new ApiError(404, "User not found");
  const preferences = await getPrivacyPreferences(userId);
  await updateRecord("privacyPreferences", String(preferences._id), { deleteRequestedAt: new Date() });
  const deletedCollections: Record<string, number> = {};
  for (const collection of userOwnedCollections) {
    const result = await deleteRecords(collection, { userId });
    deletedCollections[collection] = result.deletedCount;
  }
  const auditResult = await deleteRecords("auditLogs", { actorUserId: userId });
  deletedCollections.auditLogs = auditResult.deletedCount;
  const userDeleteResult = await deleteRecord("users", userId);
  return {
    deleted: Boolean(userDeleteResult),
    deletedCollections,
    note: "Account and user-owned data were removed from the configured store. External provider and backup retention must be handled through deployment runbooks."
  };
}
