import { sendMail } from "../../lib/mailer";
import { User } from "../users/user.model";
import { Notification } from "./notification.model";
import { publishToUser } from "./notification.realtime";
import type { EmailContent, InAppContent, NotificationType, Recipient } from "./notification.types";

// Both functions throw when delivery fails, so the queue can retry.

export const sendEmail = async ({ userId, email }: Recipient, { subject, html }: EmailContent): Promise<void> => {
  const to = email ?? (userId ? (await User.findById(userId, "email").lean())?.email : undefined);
  if (!to) {
    throw new Error(`No email address for recipient ${userId ?? "(none)"}`);
  }
  await sendMail(to, subject, html);
};

export const sendInApp = async (
  { userId }: Recipient,
  { title, body, link, tone }: InAppContent,
  type: NotificationType
): Promise<void> => {
  if (!userId) {
    throw new Error(`In-app notification "${type}" needs a userId`);
  }
  const notification = await Notification.create({ user: userId, type, title, body, link, tone });

  // Saving it is what counts: a user who isn't connected sees it next time they open the app.
  // So a failed live push is only logged; throwing would make a retry save a duplicate.
  publishToUser(userId, { event: "notification", data: notification.toObject() }).catch((error) =>
    console.error("Realtime push failed:", error)
  );
};
