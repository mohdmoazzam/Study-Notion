import mongoose from "mongoose";
import { AppError } from "../../shared/errors";
import { asyncHandler, sendSuccess } from "../../shared/http";
import { requireFields, requireUser } from "../../shared/request";
import * as reviewService from "./review.service";

export const createRating = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  requireFields(req.body, ["rating", "review", "courseId"]);

  const { courseId, rating, review } = req.body;
  const data = await reviewService.createReview(id, { courseId, rating: Number(rating), review });
  sendSuccess(res, 201, { data });
});

export const getAverageRating = asyncHandler(async (req, res) => {
  // GET requests usually carry the id in the query string; fall back to the body for older clients.
  const courseId = String(req.query.courseId ?? req.body?.courseId ?? "");
  if (!mongoose.isValidObjectId(courseId)) {
    throw AppError.badRequest("Invalid courseId");
  }

  const averageRating = await reviewService.getAverageRating(courseId);
  sendSuccess(res, 200, {
    averageRating: averageRating ?? 0,
    ...(averageRating === null && { message: "Average rating is 0, no rating given till now" }),
  });
});

export const getAllRatings = asyncHandler(async (_req, res) => {
  sendSuccess(res, 200, { data: await reviewService.getAllReviews() });
});
