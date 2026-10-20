import { Notification } from "../notification.model";
import { publishToUser } from "../notification.realtime";
import type { NotificationChannel } from "./channel";

export const inAppChannel: NotificationChannel<"inApp"> = {
  name: "inApp",
  async send({ userId }, { title, body, link, tone }, type) {
    if (!userId) {
      throw new Error(`In-app notification "${type}" needs a userId`);
    }
    const notification = await Notification.create({ user: userId, type, title, body, link, tone });

    // Saved is delivered: a user who isn't connected sees it next time they open the app.
    // So a failed live push is logged, not thrown, or a retry would store a duplicate.
    publishToUser(userId, { event: "notification", data: notification.toObject() }).catch((error) =>
      console.error("Realtime push failed:", error)
    );
  },
};
