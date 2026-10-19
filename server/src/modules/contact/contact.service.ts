import { env } from "../../config/env";
import { contactUsEmail } from "../../emails/contactForm";
import { sendMail } from "../../lib/mailer";
import { escapeHtml } from "../../shared/utils/html";

export interface ContactMessage {
  email: string;
  firstName: string;
  lastName: string;
  message: string;
  phone: string;
}

export const sendContactMessage = async ({ email, firstName, lastName, message, phone }: ContactMessage) => {
  // User input is embedded in HTML emails, so escape it.
  const html = contactUsEmail(
    escapeHtml(email),
    escapeHtml(firstName),
    escapeHtml(lastName),
    escapeHtml(message),
    escapeHtml(phone)
  );

  await Promise.all([
    sendMail(email, "Your Data send successfully", html),
    sendMail(env.contactInbox, "Someone Send this data to you", html),
  ]);
};
