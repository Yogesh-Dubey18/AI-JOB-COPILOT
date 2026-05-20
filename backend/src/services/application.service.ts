import { ApiError } from "../utils/ApiError.js";
import { createRecord, deleteRecord, findRecordById, findRecords, updateRecord } from "../utils/repository.js";
import { buildTimelineEvent, enrichApplicationForStage, summarizeApplications } from "./application-intelligence.service.js";

export async function createApplication(userId: string, input: any) {
  const status = input.status || "Saved";
  return createRecord("applications", enrichApplicationForStage({
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
  }));
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
  const app = await getApplication(userId, id);
  return updateRecord("applications", id, enrichApplicationForStage(input, app));
}

export async function updateApplicationStatus(userId: string, id: string, status: string) {
  const app = await getApplication(userId, id);
  const updates: any = { status };
  if (status === "Applied") updates.appliedDate = new Date();
  updates.statusHistory = [...(app.statusHistory || []), { status, note: "Status updated", changedAt: new Date() }];
  return updateApplication(userId, id, updates);
}

export async function getApplicationTimeline(userId: string, id: string) {
  const app = await getApplication(userId, id);
  return app.timeline || (app.statusHistory || []).map((item: any) => buildTimelineEvent("status_history", item.status, item.note || "Status updated", { status: item.status }));
}

export async function applicationInsights(userId: string) {
  const applications = await listApplications(userId);
  return summarizeApplications(applications);
}

export async function scheduleFollowUp(userId: string, id: string, nextFollowUpDate: string, note = "Follow-up scheduled") {
  const app = await getApplication(userId, id);
  const timeline = [...(app.timeline || []), buildTimelineEvent("follow_up_scheduled", "Follow-up scheduled", note, { nextFollowUpDate })];
  return updateApplication(userId, id, { nextFollowUpDate, timeline });
}

export async function deleteApplication(userId: string, id: string) {
  await getApplication(userId, id);
  return deleteRecord("applications", id);
}
