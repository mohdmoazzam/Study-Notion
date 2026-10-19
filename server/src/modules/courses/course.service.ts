import type { UploadedFile } from "express-fileupload";
import { Types } from "mongoose";
import { uploadToCloudinary } from "../../lib/cloudinary";
import { AppError } from "../../shared/errors";
import type { AuthUser } from "../../shared/types/auth";
import { convertSecondsToDuration, countSubSections, getTotalSeconds } from "../../shared/utils/duration";
import { Category } from "../categories/category.model";
import { CourseProgress } from "../progress/courseProgress.model";
import { RatingAndReview } from "../reviews/review.model";
import { User } from "../users/user.model";
import { Course, type CourseStatus } from "./course.model";
import { courseContentPopulate, findPopulatedCourse, INSTRUCTOR_PUBLIC_FIELDS, type PopulatedSection } from "./course.queries";
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
  language: string;
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

export interface InstructorStats {
  courses: number;
  students: number;
  rating: number;
  reviews: number;
}

// Totals across the instructor's published courses, shown on the course page.
const getInstructorStats = async (instructorId: Types.ObjectId): Promise<InstructorStats> => {
  const [totals] = await Course.aggregate<{ courses: number; students: number; courseIds: Types.ObjectId[] }>([
    { $match: { instructor: instructorId, status: "Published" } },
    {
      $group: {
        _id: null,
        courses: { $sum: 1 },
        students: { $sum: { $size: { $ifNull: ["$studentsEnrolled", []] } } },
        courseIds: { $push: "$_id" },
      },
    },
  ]);
  if (!totals) {
    return { courses: 0, students: 0, rating: 0, reviews: 0 };
  }

  const [ratings] = await RatingAndReview.aggregate<{ average: number; count: number }>([
    { $match: { course: { $in: totals.courseIds } } },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  return {
    courses: totals.courses,
    students: totals.students,
    rating: ratings ? Math.round(ratings.average * 10) / 10 : 0,
    reviews: ratings?.count ?? 0,
  };
};

export const getCourseDetails = async (courseId: string) => {
  // Public endpoint: never expose lecture video URLs.
  const courseDetails = await findPopulatedCourse(courseId, "-videoUrl");
  if (!courseDetails) {
    throw AppError.notFound(`Could not find course with id: ${courseId}`);
  }

  const instructorId = courseDetails.instructor?._id;
  const instructorStats = instructorId ? await getInstructorStats(new Types.ObjectId(String(instructorId))) : null;

  const totalDuration = convertSecondsToDuration(getTotalSeconds(courseDetails.courseContent));
  return { courseDetails, totalDuration, instructorStats };
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

export const INSTRUCTOR_COURSE_SORTS = ["newest", "oldest", "students", "name"] as const;
export type InstructorCourseSort = (typeof INSTRUCTOR_COURSE_SORTS)[number];

export interface InstructorCourseQuery {
  status?: CourseStatus;
  search?: string;
  sort: InstructorCourseSort;
}

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Courses without a status count as drafts.
const statusFilter = (status: CourseStatus) => (status === "Published" ? { status } : { status: { $ne: "Published" } });

// Lightweight list for the instructor's "My courses" page, filtered, searched and sorted in the database.
// `counts` ignore the status filter (but respect the search) so the status tabs always show their totals.
export const getInstructorCourses = async (instructorId: string, { status, search, sort }: InstructorCourseQuery) => {
  const instructor = new Types.ObjectId(instructorId);
  const base = search ? { instructor, courseName: { $regex: escapeRegex(search), $options: "i" } } : { instructor };
  const filter = status ? { ...base, ...statusFilter(status) } : base;
  const fields = "courseName courseDescription thumbnail price status language createdAt category courseContent";

  // Sorting by student count needs the array size, so that one goes through an aggregation for the order.
  const orderedIds =
    sort === "students"
      ? (
          await Course.aggregate<{ _id: Types.ObjectId }>([
            { $match: filter },
            { $project: { students: { $size: { $ifNull: ["$studentsEnrolled", []] } } } },
            { $sort: { students: -1, _id: -1 } },
          ])
        ).map((doc) => doc._id)
      : null;

  const query = Course.find(orderedIds ? { _id: { $in: orderedIds } } : filter, `${fields} studentsEnrolled`);
  if (sort === "name") query.sort({ courseName: 1, _id: -1 }).collation({ locale: "en", strength: 2 });
  else if (sort === "oldest") query.sort({ _id: 1 });
  else if (sort === "newest") query.sort({ _id: -1 });

  const [docs, all, published] = await Promise.all([
    query
      .populate<{ category: { name: string } | null }>("category", "name")
      .populate<{ courseContent: PopulatedSection[] }>(courseContentPopulate("timeDuration"))
      .lean(),
    Course.countDocuments(base),
    Course.countDocuments({ ...base, status: "Published" }),
  ]);

  if (orderedIds) {
    const position = new Map(orderedIds.map((id, index) => [String(id), index]));
    docs.sort((a, b) => position.get(String(a._id))! - position.get(String(b._id))!);
  }

  const courses = docs.map(({ studentsEnrolled, courseContent, category, ...course }) => ({
    ...course,
    status: course.status ?? "Draft",
    price: course.price ?? 0,
    category: category?.name ?? null,
    totalStudentsEnrolled: studentsEnrolled.length,
    sectionCount: courseContent.length,
    lectureCount: countSubSections(courseContent),
    totalDuration: convertSecondsToDuration(getTotalSeconds(courseContent)),
  }));

  return { courses, counts: { all, Published: published, Draft: all - published } };
};

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
