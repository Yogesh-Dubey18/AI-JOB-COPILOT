import { createRecord, findOneRecord, findRecords, updateRecord } from "../utils/repository.js";
import { sendEmail } from "./email.service.js";

/**
 * Lists a user's notifications with pagination. Notifications accumulate
 * unbounded over time (job alerts, application updates, etc.), so this
 * MUST be paginated at the database level rather than fetching every
 * notification a user has ever received.
 *
 * Backward compatible: calling listNotifications(userId) with no options
 * still works and returns the same shape as before (an array) for any
 * existing callers, but internally now caps at a sane default limit.
 * New callers can pass { page, limit } to get paginated results with
 * metadata via listNotificationsPaginated below.
 */
export async function listNotifications(userId: string, options: { page?: number; limit?: number } = {}) {
  const limit = Math.max(1, Math.min(options.limit || 50, 100));
  const page = Math.max(1, options.page || 1);
  return findRecords("notifications", { userId }, { sort: { createdAt: -1 }, limit, skip: (page - 1) * limit });
}

/**
 * Same as listNotifications, but also returns pagination metadata
 * (page, limit, hasMore) so the frontend can implement "load more" /
 * infinite scroll instead of loading the entire notification history
 * on every page visit.
 */
export async function listNotificationsPaginated(userId: string, options: { page?: number; limit?: number } = {}) {
  const limit = Math.max(1, Math.min(options.limit || 50, 100));
  const page = Math.max(1, options.page || 1);
  const items = await findRecords("notifications", { userId }, { sort: { createdAt: -1 }, limit: limit + 1, skip: (page - 1) * limit });
  const hasMore = items.length > limit;
  return { items: items.slice(0, limit), page, limit, hasMore };
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
