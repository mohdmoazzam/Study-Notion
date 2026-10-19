import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { otpTemplate } from "../../emails/otpVerification";
import { passwordUpdated } from "../../emails/passwordUpdated";
import { sendMail, sendMailSafe } from "../../lib/mailer";
import { AppError } from "../../shared/errors";
import type { AccountType } from "../../shared/types/auth";
import { Profile } from "../users/profile.model";
import { User } from "../users/user.model";
import { OTP } from "./otp.model";

const SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 5 * 60 * 1000;
const SELF_SIGNUP_ACCOUNT_TYPES: readonly AccountType[] = ["Student", "Instructor"];

export interface SignUpInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  accountType: AccountType;
  contactNumber?: string;
  otp: string;
}

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export const sendOtp = async (email: string): Promise<void> => {
  if (await User.exists({ email })) {
    throw AppError.conflict("User already registered");
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const otpDoc = await OTP.create({ email, otp });

  try {
    await sendMail(email, "Verification E-mail From StudyNotion", otpTemplate(otp));
  } catch (error) {
    await otpDoc.deleteOne();
    throw error;
  }
};

export const signUp = async (input: SignUpInput) => {
  const { firstName, lastName, email, password, accountType, contactNumber, otp } = input;

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
    Profile.create({ gender: null, dateOfBirth: null, about: null, contactNumber: contactNumber ?? null }),
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

export const logIn = async (email: string, password: string, accountType?: AccountType) => {
  const user = await User.findOne({ email }).select("+password").populate("additionalDetails");
  if (!user) {
    throw AppError.notFound("User is not registered");
  }
  if (!(await bcrypt.compare(password, user.password))) {
    throw AppError.unauthorized("Entered password is incorrect.Try again");
  }
  // Checked after the password so the account's role isn't revealed to someone without it.
  // Admins have no login option of their own, so they may sign in under either type.
  if (accountType && user.accountType !== "Admin" && user.accountType !== accountType) {
    throw AppError.forbidden(
      `This is a ${user.accountType} account. Please select ${user.accountType} to log in.`
    );
  }

  const token = jwt.sign(
    { email: user.email, id: user._id.toString(), accountType: user.accountType },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresInSeconds }
  );

  const { password: _password, ...publicUser } = user.toObject();
  return { token, user: { ...publicUser, token } };
};

export const changePassword = async (userId: string, oldPassword: string, newPassword: string): Promise<void> => {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw AppError.notFound("User not found");
  }
  if (!(await bcrypt.compare(oldPassword, user.password))) {
    throw AppError.unauthorized("The password is incorrect");
  }

  user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();

  sendMailSafe(
    user.email,
    "Password for your account has been updated",
    passwordUpdated(user.email, `Password updated successfully for ${user.firstName} ${user.lastName}`)
  );
};

export const requestPasswordReset = async (email: string): Promise<void> => {
  // The raw token only goes out by email; the database stores its hash.
  const token = crypto.randomBytes(32).toString("hex");
  const user = await User.findOneAndUpdate(
    { email },
    { token: hashToken(token), resetPasswordExpires: new Date(Date.now() + RESET_TOKEN_TTL_MS) }
  );
  if (!user) {
    throw AppError.notFound("Email is not registered");
  }

  const url = `${env.clientUrl}/update-password/${token}`;
  await sendMail(email, "Password Reset Link", `Password Reset Link: <a href="${url}">${url}</a>`);
};

export const resetPassword = async (token: string, password: string): Promise<void> => {
  const user = await User.findOne({
    token: hashToken(token),
    resetPasswordExpires: { $gt: new Date() },
  });
  if (!user) {
    throw AppError.unauthorized("Token is invalid or expired, please regenerate your token");
  }

  user.password = await bcrypt.hash(password, SALT_ROUNDS);
  user.token = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
};
