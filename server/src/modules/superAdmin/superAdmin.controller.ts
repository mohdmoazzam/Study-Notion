import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors";
import { asyncHandler, sendSuccess } from "../../shared/http";
import { requireFields } from "../../shared/request";
import * as superAdminService from "./superAdmin.service";

const BEARER_PREFIX = "Bearer ";

// Console tokens are only accepted from the Authorization header (never cookies), so requests can't be forged cross-site.
export const authenticateSuperAdmin: RequestHandler = (req, res, next) => {
  const header = req.header("Authorization");
  const token = header?.startsWith(BEARER_PREFIX) ? header.slice(BEARER_PREFIX.length) : undefined;
  if (!token) {
    return next(AppError.unauthorized("Token is missing"));
  }
  try {
    res.locals.superAdminEmail = superAdminService.verifySession(token);
    next();
  } catch (error) {
    next(error);
  }
};

export const logIn = asyncHandler(async (req, res) => {
  requireFields(req.body, ["email", "password"]);
  const session = superAdminService.logIn(String(req.body.email), String(req.body.password), req.ip ?? "unknown");
  sendSuccess(res, 200, { message: "Logged in", ...session });
});

// Lets the console check a stored token on load.
export const getSession = asyncHandler(async (_req, res) => {
  sendSuccess(res, 200, { email: res.locals.superAdminEmail });
});
