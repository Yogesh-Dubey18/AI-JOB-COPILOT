import { createRecord, findRecords, updateRecord } from "../utils/repository.js";

export async function listNotifications(userId: string) {
  return findRecords("notifications", { userId }, { sort: { createdAt: -1 } });
}

export async function createNotification(userId: string, input: any) {
  return createRecord("notifications", { userId, isRead: false, ...input });
}

export async function markNotificationRead(userId: string, id: string) {
  const notifications = await findRecords("notifications", { userId });
  const target = notifications.find((item: any) => String(item._id) === id);
  return target ? updateRecord("notifications", id, { isRead: true }) : null;
}

export async function markAllNotificationsRead(userId: string) {
  const notifications = await findRecords("notifications", { userId, isRead: false });
  await Promise.all(notifications.map((item: any) => updateRecord("notifications", String(item._id), { isRead: true })));
  return { updated: notifications.length };
}
