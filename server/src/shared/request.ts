import type { Request } from "express";
import type { UploadedFile } from "express-fileupload";
import { AppError } from "./errors";
import type { AuthUser } from "./types/auth";

export const requireUser = (req: Request): AuthUser => {
  if (!req.user) {
    throw AppError.unauthorized("Token is missing");
  }
  return req.user;
};

export const isPresent = (value: unknown): boolean => value !== undefined && value !== null && value !== "";

export const requireFields = (
  body: Record<string, unknown>,
  fields: string[],
  message = "All fields are required"
): void => {
  if (!fields.every((field) => isPresent(body[field]))) {
    throw AppError.badRequest(message);
  }
};

export const getUploadedFile = (req: Request, name: string): UploadedFile | undefined => {
  const file = req.files?.[name];
  return Array.isArray(file) ? file[0] : file;
};

// Multipart forms send arrays as JSON strings.
export const parseStringArray = (value: unknown, field: string): string[] => {
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw AppError.badRequest(`Invalid ${field}`);
    }
  }
  if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) {
    throw AppError.badRequest(`Invalid ${field}`);
  }
  return parsed;
};

export const parseNonNegativeNumber = (value: unknown, field: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw AppError.badRequest(`Invalid ${field}`);
  }
  return parsed;
};
