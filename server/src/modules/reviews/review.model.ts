import { Schema, Types, model } from "mongoose";

export interface IRatingAndReview {
  user: Types.ObjectId;
  rating: number;
  review: string;
  course: Types.ObjectId;
}

const ratingAndReviewSchema = new Schema<IRatingAndReview>({
  user: { type: Schema.Types.ObjectId, required: true, ref: "user" },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, required: true, trim: true },
  course: { type: Schema.Types.ObjectId, required: true, ref: "Course", index: true },
});

ratingAndReviewSchema.index({ user: 1, course: 1 });

export const RatingAndReview = model<IRatingAndReview>("RatingAndReview", ratingAndReviewSchema);
