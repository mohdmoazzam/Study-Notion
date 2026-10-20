import crypto from "crypto";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import type { HydratedDocument } from "mongoose";
import { env } from "../../config/env";
import { AppError } from "../../shared/errors";
import type { AccountType } from "../../shared/types/auth";
import { Profile } from "../users/profile.model";
import { notify, notifySafe } from "../notifications/notification.service";
import { type IUser, User } from "../users/user.model";
import { OTP } from "./otp.model";

const SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 5 * 60 * 1000;
const SELF_SIGNUP_ACCOUNT_TYPES: readonly AccountType[] = [
  "Student",
  "Instructor",
];

export interface SignUpInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  accountType: AccountType;
  contactNumber?: string;
  otp: string;
}

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const sendOtp = async (email: string): Promise<void> => {
  if (await User.exists({ email })) {
    throw AppError.conflict("User already registered");
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const otpDoc = await OTP.create({ email, otp });

  try {
    await notify("auth.otp", { email }, { otp }, { immediate: true });
  } catch (error) {
    await otpDoc.deleteOne();
    throw error;
  }
};

export const signUp = async (input: SignUpInput) => {
  const {
    firstName,
    lastName,
    email,
    password,
    accountType,
    contactNumber,
    otp,
  } = input;

  if (!SELF_SIGNUP_ACCOUNT_TYPES.includes(accountType)) {
    throw AppError.badRequest("Invalid account type");
  }

  const [userExists, latestOtp] = await Promise.all([
    User.exists({ email }),
    OTP.findOne({ email }).sort({ createdAt: -1 }).lean(),
  ]);
  if (userExists) {
    throw AppError.conflict("User is already registered");
  }
  if (!latestOtp) {
    throw AppError.badRequest("OTP not found");
  }
  if (otp !== latestOtp.otp) {
    throw AppError.badRequest("Invalid otp.Try again");
  }

  const [hashedPassword, profile] = await Promise.all([
    bcrypt.hash(password, SALT_ROUNDS),
    Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: contactNumber ?? null,
    }),
  ]);

  let user;
  try {
    user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      accountType,
      additionalDetails: profile._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${encodeURIComponent(`${firstName} ${lastName}`)}`,
    });
  } catch (error) {
    await profile.deleteOne();
    throw error;
  }

  await OTP.deleteMany({ email });

  const { password: _password, ...publicUser } = user.toObject();
  return publicUser;
};

export const LOGIN_ACCOUNT_TYPES = SELF_SIGNUP_ACCOUNT_TYPES;

export const logIn = async (
  email: string,
  password: string,
  accountType?: AccountType,
) => {
  const user = await User.findOne({ email })
    .select("+password")
    .populate("additionalDetails");
  if (!user) {
    throw AppError.notFound("User is not registered");
  }
  if (!user.password) {
    throw AppError.unauthorized(
      "This account uses Google sign-in. Continue with Google, or reset your password to set one.",
    );
  }
  if (!(await bcrypt.compare(password, user.password))) {
    throw AppError.unauthorized("Entered password is incorrect.Try again");
  }
  // Checked after the password so the account's role isn't revealed to someone without it.
  assertAccountType(user.accountType, accountType);

  return issueSession(user);
};

// Admins have no login option of their own, so they may sign in under either type.
const assertAccountType = (actual: AccountType, selected?: AccountType) => {
  if (selected && actual !== "Admin" && actual !== selected) {
    throw AppError.forbidden(
      `This is a ${actual} account. Please select ${actual} to log in.`,
    );
  }
};

const issueSession = (user: HydratedDocument<IUser>) => {
  const token = jwt.sign(
    {
      email: user.email,
      id: user._id.toString(),
      accountType: user.accountType,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresInSeconds },
  );

  const { password: _password, googleId: _googleId, ...publicUser } = user.toObject();
  return { token, user: { ...publicUser, token } };
};

const googleClient = new OAuth2Client();

const verifyGoogleCredential = async (credential: string) => {
  if (!env.googleClientId) {
    throw AppError.badRequest("Google sign-in is not configured");
  }
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.googleClientId,
    });
    const payload = ticket.getPayload();
    if (payload?.email && payload.email_verified) return payload;
  } catch {
    // Falls through to the generic error below.
  }
  throw AppError.unauthorized("Google sign-in failed. Please try again.");
};

// Logs in the account matching the Google email, or creates one with `accountType` when none exists.
// Google has already verified the email, so no OTP step is needed.
export const googleAuth = async (credential: string, accountType?: AccountType) => {
  const google = await verifyGoogleCredential(credential);
  const email = google.email as string;

  // By googleId too, in case the Google account's email changed after linking.
  // Case-insensitive so accounts registered as "Name@Gmail.com" still match.
  const existing = await User.findOne({ $or: [{ googleId: google.sub }, { email }] })
    .collation({ locale: "en", strength: 2 })
    .select("+googleId")
    .populate("additionalDetails");
  if (existing) {
    assertAccountType(existing.accountType, accountType);
    if (!existing.googleId) {
      existing.googleId = google.sub;
      await existing.save();
    }
    return { ...issueSession(existing), created: false };
  }

  const type = accountType ?? "Student";
  if (!SELF_SIGNUP_ACCOUNT_TYPES.includes(type)) {
    throw AppError.badRequest("Invalid account type");
  }

  const firstName = google.given_name || google.name || email.split("@")[0];
  const lastName = google.family_name ?? "";
  const profile = await Profile.create({
    gender: null,
    dateOfBirth: null,
    about: null,
    contactNumber: null,
  });

  let user;
  try {
    user = await User.create({
      firstName,
      lastName,
      email,
      googleId: google.sub,
      accountType: type,
      additionalDetails: profile._id,
      image:
        google.picture ||
        `https://api.dicebear.com/5.x/initials/svg?seed=${encodeURIComponent(`${firstName} ${lastName}`)}`,
    });
  } catch (error) {
    await profile.deleteOne();
    throw error;
  }

  await user.populate("additionalDetails");
  return { ...issueSession(user), created: true };
};

export const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string,
): Promise<void> => {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw AppError.notFound("User not found");
  }
  if (!user.password) {
    throw AppError.badRequest(
      "Your account doesn't have a password yet. Use \"Forgot password\" on the login page to set one.",
    );
  }
  if (!(await bcrypt.compare(oldPassword, user.password))) {
    throw AppError.unauthorized("The password is incorrect");
  }

  user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();

  notifySafe(
    "auth.passwordChanged",
    { userId, email: user.email },
    { name: `${user.firstName} ${user.lastName}`.trim(), email: user.email },
  );
};

export const requestPasswordReset = async (email: string): Promise<void> => {
  // The raw token only goes out by email; the database stores its hash.
  const token = crypto.randomBytes(32).toString("hex");
  const user = await User.findOneAndUpdate(
    { email },
    {
      token: hashToken(token),
      resetPasswordExpires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  );
  if (!user) {
    throw AppError.notFound("Email is not registered");
  }

  const url = `${env.clientUrl}/update-password/${token}`;
  await notify("auth.passwordReset", { email }, { url }, { immediate: true });
};

export const resetPassword = async (
  token: string,
  password: string,
): Promise<void> => {
  const user = await User.findOne({
    token: hashToken(token),
    resetPasswordExpires: { $gt: new Date() },
  });
  if (!user) {
    throw AppError.unauthorized(
      "Token is invalid or expired, please regenerate your token",
    );
  }

  user.password = await bcrypt.hash(password, SALT_ROUNDS);
  user.token = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
};
