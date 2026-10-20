// How a notification is sent:
//
//   notify("course.enrolled", { userId, email }, { name, courseName })
//     1. The template for the type says which channels it uses (email, inApp or both).
//     2. Each channel becomes one Delivery, so a failed email doesn't stop the in-app notification.
//     3. With Redis (REDIS_URL), deliveries go on a queue that retries failures; without it, or with
//        `immediate`, they are sent right away.
//     4. deliver() renders the template for that channel and sends it.
import { sendEmail, sendInApp } from "./notification.channels";
import { getNotificationQueue, startNotificationWorker } from "./notification.queue";
import { templates, type Template } from "./notification.templates";
import type { ChannelName, Delivery, NotificationPayloads, NotificationType, Recipient } from "./notification.types";

export interface NotifyOptions {
  // Send now and throw if it fails, skipping the queue. For mail the user is waiting on (OTP, reset link).
  immediate?: boolean;
}

// Sends one delivery. The queue worker calls this too, which is why it takes a plain Delivery object.
export const deliver = async ({ type, channel, recipient, data }: Delivery): Promise<void> => {
  // Inside a Delivery, TypeScript no longer knows that `data` matches `type`, hence the cast.
  const template = templates[type] as Template<typeof data>;

  if (channel === "email" && template.email) {
    await sendEmail(recipient, template.email(data));
  } else if (channel === "inApp" && template.inApp) {
    await sendInApp(recipient, template.inApp(data), type);
  } else {
    throw new Error(`Notification "${type}" has no ${channel} template`);
  }
};

// Sends every delivery, even if one fails, then throws the first failure.
const deliverAll = async (deliveries: Delivery[]): Promise<void> => {
  const results = await Promise.allSettled(deliveries.map(deliver));
  const failed = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
  if (failed) throw failed.reason;
};

export const notify = async <T extends NotificationType>(
  type: T,
  recipient: Recipient,
  data: NotificationPayloads[T],
  { immediate = false }: NotifyOptions = {}
): Promise<void> => {
  const channels = (["email", "inApp"] as ChannelName[]).filter((channel) => templates[type][channel]);
  const deliveries: Delivery[] = channels.map((channel) => ({ type, channel, recipient, data }));

  const queue = immediate ? undefined : getNotificationQueue();
  if (queue) {
    try {
      await queue.addBulk(deliveries.map((delivery) => ({ name: `${type}:${delivery.channel}`, data: delivery })));
      return;
    } catch (error) {
      // Redis is unreachable: send now rather than lose the notification.
      console.error(`Could not queue "${type}", sending directly:`, error);
    }
  }
  await deliverAll(deliveries);
};

// Like notify(), for notifications whose failure shouldn't fail the request: errors are only logged.
export const notifySafe = <T extends NotificationType>(type: T, recipient: Recipient, data: NotificationPayloads[T]): void => {
  notify(type, recipient, data).catch((error) => {
    console.error(`Failed to send "${type}" notification to ${recipient.userId ?? recipient.email}:`, error);
  });
};

// Starts the queue worker (only does anything when Redis is configured).
export const startNotifications = (): void => startNotificationWorker(deliver);
