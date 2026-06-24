import { ApiError } from "../utils/ApiError.js";
import { createRecord, deleteRecord, findOneRecord, findRecordById, findRecords, updateRecord } from "../utils/repository.js";
import { buildTimelineEvent, enrichApplicationForStage, summarizeApplications } from "./application-intelligence.service.js";
import { createNotification } from "./notification.service.js";

async function enrichWithContact(userId: string, app: any) {
  if (!app) return app;
  if (app.contactId) {
    try {
      const contact = await findRecordById("contacts", String(app.contactId));
      if (contact && String(contact.userId) === userId) {
        return { ...app, contact };
      }
    } catch (e) {
      // ignore
    }
  }
  return app;
}

async function enrichListWithContacts(userId: string, apps: any[]) {
  const contacts = await findRecords("contacts", { userId });
  const contactMap = new Map(contacts.map((c) => [String(c._id), c]));
  return apps.map((app) => {
    if (app.contactId && contactMap.has(String(app.contactId))) {
      return { ...app, contact: contactMap.get(String(app.contactId)) };
    }
    return app;
  });
}

export async function createApplication(userId: string, input: any) {
  const status = input.status || "Saved";
  if (input.jobId) {
    const existing = await findOneRecord("applications", { userId, jobId: input.jobId });
    if (existing) {
      const updates: any = {
        status,
        updatedAt: new Date()
      };
      if (status === "Applied" && existing.status !== "Applied") {
        updates.appliedDate = input.appliedDate || new Date();
      }
      if (input.resumeVersionId) updates.resumeVersionId = input.resumeVersionId;
      if (input.applicationKitId) updates.applicationKitId = input.applicationKitId;
      if (input.contactId) updates.contactId = input.contactId;
      if (input.notes) updates.notes = input.notes;

      const currentHistory = existing.statusHistory || [];
      const statusChanged = existing.status !== status;
      if (statusChanged) {
        updates.statusHistory = [...currentHistory, { status, note: `Status updated to ${status}`, changedAt: new Date() }];
      }

      const updated = await updateRecord("applications", String(existing._id), enrichApplicationForStage(updates, existing));
      return enrichWithContact(userId, updated);
    }
  }

  const created = await createRecord("applications", enrichApplicationForStage({
    userId,
    jobId: input.jobId,
    company: input.company,
    role: input.role,
    appliedDate: input.appliedDate || (status === "Applied" ? new Date() : undefined),
    applicationSource: input.applicationSource,
    resumeVersionId: input.resumeVersionId,
    applicationKitId: input.applicationKitId,
    contactId: input.contactId,
    status,
    currentRound: input.currentRound,
    notes: input.notes || "",
    statusHistory: [{ status, note: "Application created", changedAt: new Date() }],
    rejectionReason: input.rejectionReason,
    offerDetails: input.offerDetails,
    nextFollowUpDate: input.nextFollowUpDate
  }));
  return enrichWithContact(userId, created);
}

export async function listApplications(userId: string) {
  const apps = await findRecords("applications", { userId }, { sort: { updatedAt: -1 } });
  return enrichListWithContacts(userId, apps);
}

export async function getApplication(userId: string, id: string) {
  const app = await findRecordById("applications", id);
  if (!app || String(app.userId) !== userId) throw new ApiError(404, "Application not found");
  return enrichWithContact(userId, app);
}

export async function updateApplication(userId: string, id: string, input: any) {
  const app = await getApplication(userId, id);
  const updated = await updateRecord("applications", id, enrichApplicationForStage(input, app));
  return enrichWithContact(userId, updated);
}

export async function updateApplicationStatus(userId: string, id: string, status: string) {
  const app = await getApplication(userId, id);
  const updates: any = { status };
  if (status === "Applied") updates.appliedDate = new Date();
  updates.statusHistory = [...(app.statusHistory || []), { status, note: "Status updated", changedAt: new Date() }];
  const updated = await updateApplication(userId, id, updates);
  if (["Interview Scheduled", "Technical Round", "HR Round", "Offer"].includes(status)) {
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
