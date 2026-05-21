import { findRecordById, findRecords } from "../utils/repository.js";
import { createCalendarEvent } from "./calendar.service.js";
import { createNotification, deliverNotificationEmail, getNotificationPreferences } from "./notification.service.js";

function isDue(date: unknown) {
  if (!date) return false;
  const parsed = new Date(String(date));
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() <= Date.now() + 24 * 60 * 60 * 1000;
}

export async function runApplicationReminderScan(userId: string) {
  const preferences = await getNotificationPreferences(userId);
  if (!preferences.applicationReminders) return { scanned: 0, created: 0, skipped: "application reminders disabled" };
  const applications = await findRecords("applications", { userId });
  const due = applications.filter((app: any) => !["Selected", "Rejected", "Withdrawn"].includes(app.status) && isDue(app.nextFollowUpDate));
  const user = await findRecordById("users", userId);
  const results = [];

  for (const app of due) {
    const notification = await createNotification(userId, {
      type: "application_follow_up",
      title: `Follow up: ${app.role}`,
      message: `Follow up with ${app.company} for ${app.role}. Current status: ${app.status}.`,
      actionUrl: `/applications/${app._id}`,
      priority: app.followUpStatus === "overdue" ? "high" : "normal",
      scheduledFor: app.nextFollowUpDate,
      dedupeKey: `application-follow-up:${app._id}:${new Date(app.nextFollowUpDate).toISOString().slice(0, 10)}`,
      metadata: { applicationId: app._id, company: app.company, role: app.role, status: app.status }
    });
    const email = preferences.email ? await deliverNotificationEmail(user?.email, notification) : { sent: false, provider: "disabled" };
    const calendar = preferences.calendar ? await createCalendarEvent({ title: notification.title, description: notification.message, startsAt: app.nextFollowUpDate, metadata: notification.metadata }) : { created: false, provider: "disabled" };
    results.push({ notification, email, calendar });
  }

  return { scanned: applications.length, due: due.length, created: results.length, results };
}
