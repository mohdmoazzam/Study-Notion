import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { AppError } from "../errors";
import type { AccountType, AuthUser } from "../types/auth";

const BEARER_PREFIX = "Bearer ";

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.header("Authorization");
  const headerToken = header?.startsWith(BEARER_PREFIX) ? header.slice(BEARER_PREFIX.length) : undefined;
  const token: string | undefined = headerToken || req.cookies?.token || req.body?.token;

  if (!token) {
    return next(AppError.unauthorized("Token is missing"));
  }

  try {
    const { id, email, accountType } = jwt.verify(token, env.jwtSecret) as AuthUser;
    req.user = { id, email, accountType };
    next();
  } catch {
    next(AppError.unauthorized("Token is invalid"));
  }
};

const requireRole =
  (role: AccountType, label: string): RequestHandler =>
  (req, _res, next) => {
    if (req.user?.accountType !== role) {
      return next(AppError.forbidden(`This is a protected route for ${label} only`));
    }
    next();
  };

export const isStudent = requireRole("Student", "students");
export const isInstructor = requireRole("Instructor", "instructor");
export const isAdmin = requireRole("Admin", "Admin");
