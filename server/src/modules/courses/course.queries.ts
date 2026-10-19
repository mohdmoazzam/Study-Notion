import type { FilterQuery, PopulateOptions, Types } from "mongoose";
import { AppError } from "../../shared/errors";
import { Course, type ICourse } from "./course.model";
import type { ISubSection } from "./subSection.model";

export const INSTRUCTOR_PUBLIC_FIELDS = "firstName lastName email image additionalDetails";

export type PopulatedSection = {
  _id: Types.ObjectId;
  sectionName?: string;
  subSection: (ISubSection & { _id: Types.ObjectId })[];
};

export const courseContentPopulate = (subSectionSelect?: string): PopulateOptions => ({
  path: "courseContent",
  populate: subSectionSelect ? { path: "subSection", select: subSectionSelect } : { path: "subSection" },
});

const fullCoursePopulate = (subSectionSelect?: string): PopulateOptions[] => [
  { path: "instructor", select: INSTRUCTOR_PUBLIC_FIELDS, populate: { path: "additionalDetails" } },
  { path: "category" },
  { path: "ratingAndReviews" },
  courseContentPopulate(subSectionSelect),
];

export const findPopulatedCourse = (courseId: unknown, subSectionSelect?: string) =>
  Course.findById(courseId)
    .populate<{ courseContent: PopulatedSection[] }>(fullCoursePopulate(subSectionSelect))
    .lean();

export const findCourseWithContent = (courseId: unknown) =>
  Course.findById(courseId).populate(courseContentPopulate()).lean();

// Throws unless a course matching `filter` exists and belongs to the instructor.
export const assertCourseOwner = async (filter: FilterQuery<ICourse>, instructorId: string): Promise<Types.ObjectId> => {
  const course = await Course.exists({ ...filter, instructor: instructorId });
  if (!course) {
    throw AppError.notFound("Course not found");
  }
  return course._id;
};
