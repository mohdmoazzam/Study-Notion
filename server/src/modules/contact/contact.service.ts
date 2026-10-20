import { env } from "../../config/env";
import { notify } from "../notifications/notification.service";
import type { ContactDetails } from "../notifications/notification.types";

export type ContactMessage = ContactDetails;

// Sent immediately so the visitor sees an error if either email can't go out.
export const sendContactMessage = async (details: ContactMessage) => {
  await Promise.all([
    notify("contact.confirmation", { email: details.email }, details, { immediate: true }),
    notify("contact.received", { email: env.contactInbox }, details, { immediate: true }),
  ]);
};
