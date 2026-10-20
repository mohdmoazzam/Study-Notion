import type { ChannelContent, ChannelName, NotificationType, Recipient } from "../notification.types";

export interface NotificationChannel<C extends ChannelName = ChannelName> {
  name: C;
  // Throws on failure so the queue can retry.
  send(recipient: Recipient, content: ChannelContent[C], type: NotificationType): Promise<void>;
}
