import mongoose from "mongoose";
import { AppError } from "../../shared/errors";
import { Course } from "../courses/course.model";
import { RatingAndReview } from "./review.model";

export interface ReviewInput {
  courseId: string;
  rating: number;
  review: string;
}

export const createReview = async (userId: string, { courseId, rating, review }: ReviewInput) => {
  const [isEnrolled, alreadyReviewed] = await Promise.all([
    Course.exists({ _id: courseId, studentsEnrolled: userId }),
    RatingAndReview.exists({ user: userId, course: courseId }),
  ]);

  if (!isEnrolled) {
    throw AppError.notFound("Student is not enrolled in the course");
  }
  if (alreadyReviewed) {
    throw AppError.conflict("Course is already reviewed by the user");
  }

  const ratingReview = await RatingAndReview.create({ rating, review, course: courseId, user: userId });
  await Course.updateOne({ _id: courseId }, { $push: { ratingAndReviews: ratingReview._id } });
  return ratingReview;
};

export const getAverageRating = async (courseId: string): Promise<number | null> => {
  const [result] = await RatingAndReview.aggregate<{ averageRating: number }>([
    { $match: { course: new mongoose.Types.ObjectId(courseId) } },
    { $group: { _id: null, averageRating: { $avg: "$rating" } } },
  ]);
  return result?.averageRating ?? null;
};

export const getAllReviews = () =>
  RatingAndReview.find({})
    .sort({ rating: -1 })
    .populate({ path: "user", select: "firstName lastName email image" })
    .populate({ path: "course", select: "courseName" })
    .lean();
