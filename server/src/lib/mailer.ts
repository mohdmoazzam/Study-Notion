import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env";

const SENDER_NAME = "StudyNotion";
const BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_TIMEOUT_MS = 15_000;

export const mailTransport = env.mail.brevoApiKey ? "Brevo API" : `SMTP (${env.mail.host})`;

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

const sendViaSmtp = async (to: string, subject: string, html: string): Promise<void> => {
  await getTransporter().sendMail({ from: `"${SENDER_NAME}" <${env.mail.from}>`, to, subject, html });
};

// Brevo's transactional API goes over HTTPS, so it works where outbound SMTP ports are blocked.
const sendViaBrevo = async (to: string, subject: string, html: string): Promise<void> => {
  const response = await fetch(BREVO_SEND_URL, {
    method: "POST",
    headers: { "api-key": env.mail.brevoApiKey, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: env.mail.from },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(BREVO_TIMEOUT_MS),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { code?: string; message?: string };
    throw new Error(`Brevo rejected the email (${response.status} ${body.code ?? ""}): ${body.message ?? response.statusText}`);
  }
};

// Low-level transport used by the email notification channel. App code sends through notify() instead.
export const sendMail = (to: string, subject: string, html: string): Promise<void> =>
  env.mail.brevoApiKey ? sendViaBrevo(to, subject, html) : sendViaSmtp(to, subject, html);
