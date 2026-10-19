import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { AppError } from "../../shared/errors";

// Distinguishes console tokens from user tokens, which are signed with the same secret but carry no audience.
const AUDIENCE = "super-admin";
const SESSION_SECONDS = 4 * 60 * 60;

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const MAX_TRACKED_CLIENTS = 1000;

interface SuperAdminClaims {
  email: string;
  // Changes when the env credentials change, which signs out existing sessions.
  credentialsVersion: string;
}

const isConfigured = () => Boolean(env.superAdmin.email && env.superAdmin.password);

const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest();

const credentialsVersion = () =>
  sha256(`${env.superAdmin.email}:${env.superAdmin.password}`).toString("hex").slice(0, 16);

// Hashing first gives equal-length buffers, so the comparison is constant-time whatever was typed.
const safeEqual = (a: string, b: string) => crypto.timingSafeEqual(sha256(a), sha256(b));

// Failed logins per client IP, kept in memory: the console has a single fixed account.
const failedAttempts = new Map<string, { count: number; firstFailedAt: number }>();

const pruneExpired = (now: number) => {
  for (const [client, entry] of failedAttempts) {
    if (now - entry.firstFailedAt > LOCKOUT_MS) failedAttempts.delete(client);
  }
};

const assertNotLockedOut = (client: string, now: number) => {
  const entry = failedAttempts.get(client);
  if (!entry) return;
  if (now - entry.firstFailedAt > LOCKOUT_MS) {
    failedAttempts.delete(client);
    return;
  }
  if (entry.count >= MAX_FAILED_ATTEMPTS) {
    const minutes = Math.ceil((LOCKOUT_MS - (now - entry.firstFailedAt)) / 60000);
    throw new AppError(429, `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}`);
  }
};

const recordFailure = (client: string, now: number) => {
  if (failedAttempts.size >= MAX_TRACKED_CLIENTS) pruneExpired(now);
  const entry = failedAttempts.get(client);
  failedAttempts.set(client, entry ? { ...entry, count: entry.count + 1 } : { count: 1, firstFailedAt: now });
};

export const logIn = (email: string, password: string, client: string) => {
  if (!isConfigured()) {
    throw new AppError(503, "Super admin login is not configured");
  }

  const now = Date.now();
  assertNotLockedOut(client, now);

  // Both are always compared so a wrong email takes as long as a wrong password.
  const emailMatches = safeEqual(email.trim().toLowerCase(), env.superAdmin.email);
  const passwordMatches = safeEqual(password, env.superAdmin.password);
  if (!(emailMatches && passwordMatches)) {
    recordFailure(client, now);
    throw AppError.unauthorized("Invalid email or password");
  }

  failedAttempts.delete(client);
  const claims: SuperAdminClaims = { email: env.superAdmin.email, credentialsVersion: credentialsVersion() };
  const token = jwt.sign(claims, env.jwtSecret, { audience: AUDIENCE, expiresIn: SESSION_SECONDS });
  return { token, email: env.superAdmin.email, expiresAt: new Date(now + SESSION_SECONDS * 1000).toISOString() };
};

// Returns the session's email, or throws if the token is missing, expired or from older credentials.
export const verifySession = (token: string): string => {
  if (!isConfigured()) {
    throw AppError.unauthorized("Super admin login is not configured");
  }
  try {
    const claims = jwt.verify(token, env.jwtSecret, { audience: AUDIENCE }) as SuperAdminClaims;
    if (claims.credentialsVersion !== credentialsVersion()) throw new Error("Stale credentials");
    return claims.email;
  } catch {
    throw AppError.unauthorized("Your session has expired. Log in again");
  }
};
