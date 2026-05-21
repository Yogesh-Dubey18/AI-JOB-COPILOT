import { ApiError } from "../utils/ApiError.js";
import { createRecord, deleteRecord, findRecordById, findRecords, updateRecord } from "../utils/repository.js";
import { buildTimelineEvent, enrichApplicationForStage, summarizeApplications } from "./application-intelligence.service.js";
import { createNotification } from "./notification.service.js";

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
  const updated = await updateApplication(userId, id, updates);
  if (["HR Call", "Assignment", "Technical Round 1", "Technical Round 2", "Managerial Round", "HR Round", "Offer"].includes(status)) {
    await createNotification(userId, {
      type: "application_stage",
      title: `${status}: ${updated.role}`,
      message: `${updated.company} moved to ${status}. Prepare next steps and schedule follow-up.`,
      actionUrl: `/applications/${updated._id}`,
      priority: status === "Offer" ? "high" : "normal",
      dedupeKey: `application-stage:${updated._id}:${status}`
    });
  }
  return updated;
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
  const updated = await updateApplication(userId, id, { nextFollowUpDate, timeline });
  await createNotification(userId, {
    type: "application_follow_up_scheduled",
    title: `Follow-up scheduled: ${updated.role}`,
    message: `${updated.company} follow-up scheduled for ${new Date(nextFollowUpDate).toLocaleDateString()}.`,
    actionUrl: `/applications/${updated._id}`,
    scheduledFor: nextFollowUpDate,
    dedupeKey: `application-follow-up-scheduled:${updated._id}:${new Date(nextFollowUpDate).toISOString().slice(0, 10)}`
  });
  return updated;
}

export async function deleteApplication(userId: string, id: string) {
  await getApplication(userId, id);
  return deleteRecord("applications", id);
}
