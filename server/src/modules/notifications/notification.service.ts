import { channels } from "./channels";
import type { NotificationChannel } from "./channels/channel";
import { getNotificationQueue, startNotificationWorker } from "./notification.queue";
import { templates, type NotificationTemplate } from "./notification.templates";
import type { ChannelName, Delivery, NotificationPayloads, NotificationType, Recipient } from "./notification.types";

export interface NotifyOptions {
  // Overrides the template's default channels.
  channels?: ChannelName[];
  // Deliver now and throw if it fails, bypassing the queue. For mail the user is waiting on (OTP, reset link).
  immediate?: boolean;
}

// Renders one channel's content from the template and sends it. The queue worker runs this too.
export const deliver = async ({ type, channel, recipient, data }: Delivery): Promise<void> => {
  const template = templates[type] as NotificationTemplate<typeof data>;
  const render = template.render[channel];
  if (!render) {
    throw new Error(`Notification "${type}" has no ${channel} template`);
  }
  await (channels[channel] as NotificationChannel).send(recipient, render(data), type);
};

const deliverAll = async (deliveries: Delivery[]): Promise<void> => {
  const results = await Promise.allSettled(deliveries.map(deliver));
  const failure = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
  if (failure) throw failure.reason;
};

// Sends a notification on each of its channels. Each channel is delivered (and retried) on its own,
// so a failed email doesn't stop the in-app notification. With Redis this resolves once the
// deliveries are queued; without it, or with `immediate`, once they're delivered.
export const notify = async <T extends NotificationType>(
  type: T,
  recipient: Recipient,
  data: NotificationPayloads[T],
  options: NotifyOptions = {}
): Promise<void> => {
  const template = templates[type];
  const selected = options.channels ?? template.channels;
  const missing = selected.filter((channel) => !template.render[channel]);
  if (missing.length) {
    throw new Error(`Notification "${type}" has no template for: ${missing.join(", ")}`);
  }

  const deliveries: Delivery[] = selected.map((channel) => ({ type, channel, recipient, data }));
  const queue = options.immediate ? undefined : getNotificationQueue();
  if (!queue) {
    await deliverAll(deliveries);
    return;
  }

  try {
    await queue.addBulk(deliveries.map((delivery) => ({ name: `${delivery.type}:${delivery.channel}`, data: delivery })));
  } catch (error) {
    // Redis unreachable: deliver now rather than drop the notification.
    console.error(`Could not queue "${type}", delivering directly:`, error);
    await deliverAll(deliveries);
  }
};

// For notifications whose failure shouldn't fail the request.
export const notifySafe = <T extends NotificationType>(
  type: T,
  recipient: Recipient,
  data: NotificationPayloads[T],
  options?: Omit<NotifyOptions, "immediate">
): void => {
  notify(type, recipient, data, options).catch((error) => {
    console.error(`Failed to send "${type}" notification to ${recipient.userId ?? recipient.email}:`, error);
  });
};

export const startNotifications = (): void => startNotificationWorker(deliver);
