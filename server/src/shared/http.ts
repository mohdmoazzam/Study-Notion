import type { NextFunction, Request, RequestHandler, Response } from "express";

// Forwards rejected promises to the error middleware so handlers don't need try/catch.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export const sendSuccess = (res: Response, statusCode: number, body: Record<string, unknown> = {}): void => {
  res.status(statusCode).json({ success: true, ...body });
};
