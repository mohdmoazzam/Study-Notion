import { Schema, Types, model } from "mongoose";

export interface ICourseProgress {
  courseID: Types.ObjectId;
  userId: Types.ObjectId;
  completedVideos: Types.ObjectId[];
}

const courseProgressSchema = new Schema<ICourseProgress>({
  courseID: { type: Schema.Types.ObjectId, ref: "Course" },
  userId: { type: Schema.Types.ObjectId, ref: "user" },
  completedVideos: [{ type: Schema.Types.ObjectId, ref: "SubSection" }],
});

courseProgressSchema.index({ userId: 1, courseID: 1 });

export const CourseProgress = model<ICourseProgress>("courseProgress", courseProgressSchema);
