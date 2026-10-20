import type { ChannelName } from "../notification.types";
import type { NotificationChannel } from "./channel";
import { emailChannel } from "./email.channel";
import { inAppChannel } from "./inApp.channel";

// A new channel (SMS, push, ...) is a file implementing NotificationChannel plus an entry here.
export const channels: { [C in ChannelName]: NotificationChannel<C> } = {
  email: emailChannel,
  inApp: inAppChannel,
};
