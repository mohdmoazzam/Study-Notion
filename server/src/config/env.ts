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
const appUrls = clientUrls.filter((url) => url !== "*");

export const env = Object.freeze({
  port: Number(process.env.PORT) || 4000,
  isProduction: process.env.NODE_ENV === "production",
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
  clientUrl: appUrls[0] ?? "http://localhost:3000",
  contactInbox: process.env.CONTACT_INBOX ?? "mohdmozzam27@gmail.com",
  mail: {
    host: required("MAIL_HOST"),
    user: required("MAIL_USER"),
    pass: required("MAIL_PASS"),
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
  },
  // Fixed credentials for the super admin console. Its login is disabled while either is unset.
  superAdmin: {
    email: (process.env.SUPER_ADMIN_EMAIL ?? "").trim().toLowerCase(),
    password: process.env.SUPER_ADMIN_PASSWORD ?? "",
  },
});
