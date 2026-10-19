import { Schema, Types, model } from "mongoose";

export const COURSE_STATUSES = ["Draft", "Published"] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

export interface ICourse {
  courseName?: string;
  courseDescription?: string;
  instructor: Types.ObjectId;
  whatYouWillLearn?: string;
  courseContent: Types.ObjectId[];
  ratingAndReviews: Types.ObjectId[];
  price?: number;
  thumbnail?: string;
  tag: string[];
  category?: Types.ObjectId;
  studentsEnrolled: Types.ObjectId[];
  instructions: string[];
  status?: CourseStatus;
  language: string;
  createdAt: Date;
}

const courseSchema = new Schema<ICourse>({
  courseName: { type: String, trim: true },
  courseDescription: { type: String },
  instructor: { type: Schema.Types.ObjectId, required: true, ref: "user", index: true },
  whatYouWillLearn: { type: String },
  courseContent: [{ type: Schema.Types.ObjectId, ref: "Section" }],
  ratingAndReviews: [{ type: Schema.Types.ObjectId, ref: "RatingAndReview" }],
  price: { type: Number, min: 0 },
  thumbnail: { type: String },
  tag: { type: [String], required: true },
  category: { type: Schema.Types.ObjectId, ref: "Category" },
  studentsEnrolled: [{ type: Schema.Types.ObjectId, required: true, ref: "user" }],
  instructions: { type: [String] },
  status: { type: String, enum: COURSE_STATUSES, index: true },
  // Language the course is taught in; older courses default to English.
  language: { type: String, trim: true, default: "English" },
  createdAt: { type: Date, default: Date.now },
});

export const Course = model<ICourse>("Course", courseSchema);
