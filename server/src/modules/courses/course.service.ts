import type { UploadedFile } from "express-fileupload";
import { uploadToCloudinary } from "../../lib/cloudinary";
import { AppError } from "../../shared/errors";
import type { AuthUser } from "../../shared/types/auth";
import { convertSecondsToDuration, getTotalSeconds } from "../../shared/utils/duration";
import { Category } from "../categories/category.model";
import { CourseProgress } from "../progress/courseProgress.model";
import { RatingAndReview } from "../reviews/review.model";
import { User } from "../users/user.model";
import { Course, type CourseStatus } from "./course.model";
import { findPopulatedCourse, INSTRUCTOR_PUBLIC_FIELDS } from "./course.queries";
import { Section } from "./section.model";
import { SubSection } from "./subSection.model";

export interface CourseInput {
  courseName: string;
  courseDescription: string;
  whatYouWillLearn: string;
  price: number;
  tag: string[];
  category: string;
  status: CourseStatus;
  instructions: string[];
}

const assertCategoryExists = async (categoryId: string): Promise<void> => {
  if (!(await Category.exists({ _id: categoryId }))) {
    throw AppError.notFound("Category Details Not Found");
  }
};

export const createCourse = async (instructorId: string, input: CourseInput, thumbnail: UploadedFile) => {
  await assertCategoryExists(input.category);

  const { secure_url } = await uploadToCloudinary(thumbnail);
  const course = await Course.create({ ...input, instructor: instructorId, thumbnail: secure_url });

  await Promise.all([
    User.updateOne({ _id: instructorId }, { $push: { courses: course._id } }),
    Category.updateOne({ _id: input.category }, { $push: { course: course._id } }),
  ]);

  return course;
};

export const editCourse = async (
  instructorId: string,
  courseId: string,
  updates: Partial<CourseInput>,
  thumbnail?: UploadedFile
) => {
  const course = await Course.findOne({ _id: courseId, instructor: instructorId });
  if (!course) {
    throw AppError.notFound("Course not found");
  }

  if (thumbnail) {
    course.thumbnail = (await uploadToCloudinary(thumbnail)).secure_url;
  }

  const previousCategory = course.category?.toString();
  if (updates.category && updates.category !== previousCategory) {
    await assertCategoryExists(updates.category);
    await Promise.all([
      Category.updateOne({ _id: previousCategory }, { $pull: { course: course._id } }),
      Category.updateOne({ _id: updates.category }, { $addToSet: { course: course._id } }),
    ]);
  }

  course.set(updates);
  await course.save();

  return findPopulatedCourse(course._id);
};

export const getAllCourses = () =>
  Course.find({}, { courseName: 1, price: 1, thumbnail: 1, instructor: 1, ratingAndReviews: 1, studentsEnrolled: 1 })
    .populate("instructor", INSTRUCTOR_PUBLIC_FIELDS)
    .lean();

export const getCourseDetails = async (courseId: string) => {
  // Public endpoint: never expose lecture video URLs.
  const courseDetails = await findPopulatedCourse(courseId, "-videoUrl");
  if (!courseDetails) {
    throw AppError.notFound(`Could not find course with id: ${courseId}`);
  }

  const totalDuration = convertSecondsToDuration(getTotalSeconds(courseDetails.courseContent));
  return { courseDetails, totalDuration };
};

export const getFullCourseDetails = async (user: AuthUser, courseId: string) => {
  const [courseDetails, courseProgress] = await Promise.all([
    findPopulatedCourse(courseId),
    CourseProgress.findOne({ courseID: courseId, userId: user.id }, "completedVideos").lean(),
  ]);

  if (!courseDetails) {
    throw AppError.notFound(`Could not find course with id: ${courseId}`);
  }

  const isOwner = courseDetails.instructor?._id?.toString() === user.id;
  const isEnrolled = courseDetails.studentsEnrolled.some((id) => id.toString() === user.id);
  if (!isOwner && !isEnrolled && user.accountType !== "Admin") {
    throw AppError.forbidden("You are not enrolled in this course");
  }

  return {
    courseDetails,
    totalDuration: convertSecondsToDuration(getTotalSeconds(courseDetails.courseContent)),
    completedVideos: courseProgress?.completedVideos ?? [],
  };
};

export const getInstructorCourses = (instructorId: string) =>
  Course.find({ instructor: instructorId }).sort({ createdAt: -1 }).lean();

export const deleteCourse = async (instructorId: string, courseId: string): Promise<void> => {
  const course = await Course.findOne({ _id: courseId, instructor: instructorId }).lean();
  if (!course) {
    throw AppError.notFound("Course not found");
  }

  const [sections, progressDocs] = await Promise.all([
    Section.find({ _id: { $in: course.courseContent } }, "subSection").lean(),
    CourseProgress.find({ courseID: course._id }, "_id").lean(),
  ]);
  const subSectionIds = sections.flatMap((section) => section.subSection);
  const progressIds = progressDocs.map((doc) => doc._id);

  await Promise.all([
    User.updateMany(
      { _id: { $in: [...course.studentsEnrolled, course.instructor] } },
      { $pull: { courses: course._id, courseProgress: { $in: progressIds } } }
    ),
    Category.updateOne({ _id: course.category }, { $pull: { course: course._id } }),
    SubSection.deleteMany({ _id: { $in: subSectionIds } }),
    Section.deleteMany({ _id: { $in: course.courseContent } }),
    CourseProgress.deleteMany({ _id: { $in: progressIds } }),
    RatingAndReview.deleteMany({ course: course._id }),
  ]);
  await Course.deleteOne({ _id: course._id });
};
