import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import { AppError } from "../errors";

export const notFound: RequestHandler = (req, _res, next) => {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

const resolveError = (err: unknown): { status: number; message: string } => {
  if (err instanceof AppError) return { status: err.statusCode, message: err.message };
  if (err instanceof mongoose.Error.CastError) return { status: 400, message: `Invalid ${err.path}` };
  if (err instanceof mongoose.Error.ValidationError) return { status: 400, message: err.message };

  const { code, type } = (err ?? {}) as { code?: number; type?: string };
  if (code === 11000) return { status: 409, message: "Resource already exists" };
  if (type === "entity.parse.failed") return { status: 400, message: "Invalid JSON body" };
  if (type === "entity.too.large") return { status: 413, message: "Request body is too large" };

  return { status: 500, message: "Something went wrong. Try again" };
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const { status, message } = resolveError(err);
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({ success: false, isSuccess: false, message });
};
