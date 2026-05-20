import { ApiError } from "../utils/ApiError.js";
import { createRecord, deleteRecord, findRecordById, findRecords, updateRecord } from "../utils/repository.js";

export async function createApplication(userId: string, input: any) {
  const status = input.status || "Saved";
  return createRecord("applications", {
    userId,
    jobId: input.jobId,
    company: input.company,
    role: input.role,
    appliedDate: input.appliedDate || (status === "Applied" ? new Date() : undefined),
    applicationSource: input.applicationSource,
    resumeVersionId: input.resumeVersionId,
    applicationKitId: input.applicationKitId,
    status,
    currentRound: input.currentRound,
    notes: input.notes || "",
    statusHistory: [{ status, note: "Application created", changedAt: new Date() }],
    rejectionReason: input.rejectionReason,
    offerDetails: input.offerDetails,
    nextFollowUpDate: input.nextFollowUpDate
  });
}

export async function listApplications(userId: string) {
  return findRecords("applications", { userId }, { sort: { updatedAt: -1 } });
}

export async function getApplication(userId: string, id: string) {
  const app = await findRecordById("applications", id);
  if (!app || String(app.userId) !== userId) throw new ApiError(404, "Application not found");
  return app;
}

export async function updateApplication(userId: string, id: string, input: any) {
  await getApplication(userId, id);
  return updateRecord("applications", id, input);
}

export async function updateApplicationStatus(userId: string, id: string, status: string) {
  const app = await getApplication(userId, id);
  const updates: any = { status };
  if (status === "Applied") updates.appliedDate = new Date();
  updates.statusHistory = [...(app.statusHistory || []), { status, note: "Status updated", changedAt: new Date() }];
  return updateApplication(userId, id, updates);
}

export async function deleteApplication(userId: string, id: string) {
  await getApplication(userId, id);
  return deleteRecord("applications", id);
}
