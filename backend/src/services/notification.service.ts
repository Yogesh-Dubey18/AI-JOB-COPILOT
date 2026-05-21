import { createRecord, findOneRecord, findRecords, updateRecord } from "../utils/repository.js";
import { sendEmail } from "./email.service.js";

export async function listNotifications(userId: string) {
  return findRecords("notifications", { userId }, { sort: { createdAt: -1 } });
}

export async function createNotification(userId: string, input: any) {
  if (input.dedupeKey) {
    const existing = await findOneRecord("notifications", { userId, dedupeKey: input.dedupeKey });
    if (existing) return existing;
  }
  return createRecord("notifications", { userId, isRead: false, channel: "in_app", priority: "normal", deliveryStatus: "pending", ...input });
}

export async function markNotificationRead(userId: string, id: string) {
  const notifications = await findRecords("notifications", { userId });
  const target = notifications.find((item: any) => String(item._id) === id);
  return target ? updateRecord("notifications", id, { isRead: true, readAt: new Date() }) : null;
}

export async function markAllNotificationsRead(userId: string) {
  const notifications = await findRecords("notifications", { userId, isRead: false });
  await Promise.all(notifications.map((item: any) => updateRecord("notifications", String(item._id), { isRead: true, readAt: new Date() })));
  return { updated: notifications.length };
}

const defaultPreferences = {
  inApp: true,
  email: false,
  calendar: false,
  dailyDigest: true,
  applicationReminders: true,
  interviewReminders: true,
  quietHoursStart: "",
  quietHoursEnd: ""
};

export async function getNotificationPreferences(userId: string) {
  return (await findOneRecord("notificationPreferences", { userId })) || createRecord("notificationPreferences", { userId, ...defaultPreferences });
}

export async function updateNotificationPreferences(userId: string, input: any) {
  const existing = await getNotificationPreferences(userId);
  return updateRecord("notificationPreferences", String(existing._id), { ...defaultPreferences, ...existing, ...input, userId });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function deliverNotificationEmail(userEmail: string, notification: any) {
  if (!userEmail) return { sent: false, provider: "mock", note: "User email missing." };
  const message = String(notification.message || "");
  return sendEmail({
    to: userEmail,
    subject: notification.title || "AI Job Copilot reminder",
    text: message,
    html: message ? `<p>${escapeHtml(message)}</p>` : undefined
  });
}
