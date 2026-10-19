import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env";

let transporter: Transporter | undefined;

// Reuse one pooled transporter instead of opening a new SMTP connection per email.
const getTransporter = (): Transporter => {
  transporter ??= nodemailer.createTransport({
    host: env.mail.host,
    pool: true,
    auth: { user: env.mail.user, pass: env.mail.pass },
  });
  return transporter;
};

export const sendMail = (to: string, subject: string, html: string) =>
  getTransporter().sendMail({
    from: `"StudyNotion" <${env.mail.user}>`,
    to,
    subject,
    html,
  });

// For notification emails whose failure shouldn't fail the request.
export const sendMailSafe = (to: string, subject: string, html: string): void => {
  sendMail(to, subject, html).catch((error) => {
    console.error(`Failed to send "${subject}" email to ${to}:`, error);
  });
};
