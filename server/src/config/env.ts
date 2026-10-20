import dotenv from "dotenv";

dotenv.config();

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

// CLIENT_URL may hold several comma-separated origins (e.g. local + deployed frontend).
// Unset or "*" allows any origin.
const clientUrls = (process.env.CLIENT_URL ?? "*")
  .split(",")
  .map((url) => url.trim().replace(/\/$/, ""))
  .filter(Boolean);
const allowAnyOrigin = clientUrls.length === 0 || clientUrls.includes("*");
const brevoApiKey = process.env.BREVO_API_KEY?.trim() ?? "";
const appUrls = clientUrls.filter((url) => url !== "*");

const isProduction = process.env.NODE_ENV === "production";
const isLocalUrl = (url: string) => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(url);

// Where links in emails (password reset, dashboard, ...) point: the first CLIENT_URL entry,
// skipping localhost ones in production so a dev origin listed first can't leak into real emails.
const frontendUrl =
  (isProduction ? appUrls.find((url) => !isLocalUrl(url)) : undefined) || appUrls[0] || "http://localhost:3000";

export const env = Object.freeze({
  port: Number(process.env.PORT) || 4000,
  isProduction,
  mongoUrl: required("MONGODB_URL"),
  // Optional override for networks whose DNS can't resolve the SRV records mongodb+srv:// needs.
  dnsServers: (process.env.DNS_SERVERS ?? "")
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresInSeconds: 2 * 60 * 60,
  // `true` makes cors reflect the request origin, which (unlike "*") also works with credentials.
  corsOrigin: allowAnyOrigin ? true : appUrls,
  // Base URL for links in emails (e.g. password reset).
  clientUrl: frontendUrl,
  // True when a production server would put localhost links in emails (no deployed URL in CLIENT_URL).
  clientUrlIsLocal: isLocalUrl(frontendUrl),
  contactInbox: process.env.CONTACT_INBOX ?? "mohdmozzam27@gmail.com",
  // With BREVO_API_KEY set, mail goes through Brevo's HTTPS API (needed on hosts that block SMTP,
  // like Render's free tier) and the SMTP settings are optional. Otherwise SMTP is used.
  mail: {
    brevoApiKey: brevoApiKey,
    host: brevoApiKey ? process.env.MAIL_HOST ?? "" : required("MAIL_HOST"),
    user: required("MAIL_USER"),
    pass: brevoApiKey ? process.env.MAIL_PASS ?? "" : required("MAIL_PASS"),
    // Sender address; with Brevo it must be a verified sender in the Brevo account.
    from: process.env.MAIL_FROM?.trim() || required("MAIL_USER"),
  },
  cloudinary: {
    cloudName: required("CLOUD_NAME"),
    apiKey: required("API_KEY"),
    apiSecret: required("API_SECRET"),
    folder: process.env.FOLDER_NAME ?? "StudyNotion",
  },
  razorpay: {
    keyId: required("RAZORPAY_KEY"),
    keySecret: required("RAZORPAY_SECRET"),
    // Secret set on the webhook in the Razorpay dashboard; the webhook route is disabled while unset.
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET?.trim() ?? "",
  },
  // Redis for the notification queue (BullMQ) and cross-instance realtime fan-out.
  // While unset, notifications are delivered in-process and realtime events stay on this instance.
  redisUrl: process.env.REDIS_URL?.trim() ?? "",
  // OAuth client ID for "Sign in with Google"; Google sign-in is disabled while unset.
  googleClientId: process.env.GOOGLE_CLIENT_ID?.trim() ?? "",
  // Fixed credentials for the super admin console. Its login is disabled while either is unset.
  superAdmin: {
    email: (process.env.SUPER_ADMIN_EMAIL ?? "").trim().toLowerCase(),
    password: process.env.SUPER_ADMIN_PASSWORD ?? "",
  },
});
