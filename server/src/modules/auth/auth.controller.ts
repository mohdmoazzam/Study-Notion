import type { CookieOptions } from "express";
import { env } from "../../config/env";
import { AppError } from "../../shared/errors";
import { asyncHandler, sendSuccess } from "../../shared/http";
import { requireFields, requireUser } from "../../shared/request";
import * as authService from "./auth.service";

const authCookieOptions: CookieOptions = {
  httpOnly: true,
  maxAge: env.jwtExpiresInSeconds * 1000,
  secure: env.isProduction,
  sameSite: env.isProduction ? "none" : "lax",
};

export const sendOtp = asyncHandler(async (req, res) => {
  requireFields(req.body, ["email"], "Email is required");
  await authService.sendOtp(String(req.body.email));
  sendSuccess(res, 201, { message: "OTP Sent Successfully" });
});

export const signUp = asyncHandler(async (req, res) => {
  requireFields(req.body, ["firstName", "lastName", "email", "password", "confirmPassword", "otp"]);
  const { firstName, lastName, email, password, confirmPassword, contactNumber, otp, accountType } = req.body;

  if (password !== confirmPassword) {
    throw AppError.badRequest("Password and confirm password does not match.Try again");
  }

  const createdUser = await authService.signUp({
    firstName,
    lastName,
    email,
    password,
    accountType: accountType ?? "Student",
    contactNumber,
    otp: String(otp),
  });
  sendSuccess(res, 201, { message: "User is registered successfully", createdUser });
});

export const logIn = asyncHandler(async (req, res) => {
  requireFields(req.body, ["email", "password"]);
  const { email, password, accountType } = req.body;

  // Optional for older clients; when sent, it must be a selectable login type.
  if (accountType !== undefined && !authService.LOGIN_ACCOUNT_TYPES.includes(accountType)) {
    throw AppError.badRequest("Invalid account type");
  }

  const { token, user } = await authService.logIn(email, password, accountType);

  res.cookie("token", token, authCookieOptions);
  sendSuccess(res, 200, { token, user, message: "Logged in successfully" });
});

export const googleAuth = asyncHandler(async (req, res) => {
  requireFields(req.body, ["credential"], "Google credential is required");
  const { credential, accountType } = req.body;

  if (accountType !== undefined && !authService.LOGIN_ACCOUNT_TYPES.includes(accountType)) {
    throw AppError.badRequest("Invalid account type");
  }

  const { token, user, created } = await authService.googleAuth(String(credential), accountType);

  res.cookie("token", token, authCookieOptions);
  sendSuccess(res, created ? 201 : 200, {
    token,
    user,
    created,
    message: created ? "Account created successfully" : "Logged in successfully",
  });
});

export const changePassword =asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  requireFields(req.body, ["oldPassword", "newPassword"]);

  await authService.changePassword(id, req.body.oldPassword, req.body.newPassword);
  sendSuccess(res, 200, { message: "Password updated successfully" });
});

export const requestPasswordReset = asyncHandler(async (req, res) => {
  requireFields(req.body, ["email"]);
  await authService.requestPasswordReset(String(req.body.email));
  sendSuccess(res, 200, { message: "Please check your mail-box" });
});

export const resetPassword = asyncHandler(async (req, res) => {
  requireFields(req.body, ["token", "password", "confirmPassword"]);
  const { token, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    throw AppError.badRequest("Password not matching");
  }

  await authService.resetPassword(String(token), password);
  sendSuccess(res, 200, { message: "Password reset successful" });
});
