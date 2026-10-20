import { Notification } from "./notification.model";
import { publishToUser } from "./notification.realtime";

export const INBOX_PAGE_SIZE = 20;

export const countUnread = (userId: string): Promise<number> =>
  Notification.countDocuments({ user: userId, readAt: null });

// Newest first; `unreadOnly` filters on the server so pages stay full.
export const listNotifications = async (userId: string, { unreadOnly, page }: { unreadOnly: boolean; page: number }) => {
  const filter = unreadOnly ? { user: userId, readAt: null } : { user: userId };
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter, "-user -__v")
      .sort({ _id: -1 })
      .skip((page - 1) * INBOX_PAGE_SIZE)
      .limit(INBOX_PAGE_SIZE)
      .lean(),
    Notification.countDocuments(filter),
    countUnread(userId),
  ]);
  return { notifications, page, totalPages: Math.max(1, Math.ceil(total / INBOX_PAGE_SIZE)), unreadCount };
};

// Other open tabs of the same user update their badge from this.
const broadcastUnread = async (userId: string): Promise<number> => {
  const count = await countUnread(userId);
  publishToUser(userId, { event: "unread", data: { count } }).catch((error) =>
    console.error("Realtime push failed:", error)
  );
  return count;
};

export const markRead = async (userId: string, notificationId: string): Promise<number> => {
  await Notification.updateOne({ _id: notificationId, user: userId, readAt: null }, { readAt: new Date() });
  return broadcastUnread(userId);
};

export const markAllRead = async (userId: string): Promise<number> => {
  await Notification.updateMany({ user: userId, readAt: null }, { readAt: new Date() });
  return broadcastUnread(userId);
};
