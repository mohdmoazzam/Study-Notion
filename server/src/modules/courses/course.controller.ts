import { AppError } from "../../shared/errors";
import { asyncHandler, sendSuccess } from "../../shared/http";
import {
  getUploadedFile,
  isPresent,
  parseNonNegativeNumber,
  parseStringArray,
  requireFields,
  requireUser,
} from "../../shared/request";
import { COURSE_STATUSES, type CourseStatus } from "./course.model";
import * as courseService from "./course.service";
import type { CourseInput } from "./course.service";

const TEXT_FIELDS = ["courseName", "courseDescription", "whatYouWillLearn", "category"] as const;
const REQUIRED_FIELDS = [...TEXT_FIELDS, "price", "tag"];

const toStatus = (value: unknown): CourseStatus =>
  COURSE_STATUSES.includes(value as CourseStatus) ? (value as CourseStatus) : "Draft";

const MAX_LANGUAGE_LENGTH = 30;

// "  hindi " -> "Hindi"
const parseLanguage = (value: unknown): string => {
  const language = String(value).trim().replace(/\s+/g, " ");
  if (language.length < 2 || language.length > MAX_LANGUAGE_LENGTH) {
    throw AppError.badRequest("Invalid language");
  }
  return language.charAt(0).toUpperCase() + language.slice(1);
};

// Only whitelisted fields can be set, so clients can't overwrite e.g. `studentsEnrolled`.
const parseCourseFields = (body: Record<string, unknown>): Partial<CourseInput> => {
  const input: Partial<CourseInput> = {};
  for (const key of TEXT_FIELDS) {
    if (isPresent(body[key])) input[key] = String(body[key]);
  }
  if (isPresent(body.price)) input.price = parseNonNegativeNumber(body.price, "price");
  if (isPresent(body.tag)) input.tag = parseStringArray(body.tag, "tag");
  if (isPresent(body.instructions)) input.instructions = parseStringArray(body.instructions, "instructions");
  if (isPresent(body.status)) input.status = toStatus(body.status);
  if (isPresent(body.language)) input.language = parseLanguage(body.language);
  return input;
};

export const createCourse = asyncHandler(async (req, res) => {
  const { id: instructorId } = requireUser(req);
  const thumbnail = getUploadedFile(req, "thumbnailImage");

  requireFields(req.body, REQUIRED_FIELDS, "All Fields are Mandatory");
  if (!thumbnail) {
    throw AppError.badRequest("All Fields are Mandatory");
  }

  // requireFields guarantees every mandatory field is present.
  const input = { status: "Draft", instructions: [], language: "English", ...parseCourseFields(req.body) } as CourseInput;
  const course = await courseService.createCourse(instructorId, input, thumbnail);
  sendSuccess(res, 200, { data: course, message: "Course Created Successfully" });
});

export const editCourse = asyncHandler(async (req, res) => {
  const { id: instructorId } = requireUser(req);
  requireFields(req.body, ["courseId"]);

  const course = await courseService.editCourse(
    instructorId,
    String(req.body.courseId),
    parseCourseFields(req.body),
    getUploadedFile(req, "thumbnailImage")
  );
  sendSuccess(res, 200, { message: "Course updated successfully", data: course });
});

export const getAllCourses = asyncHandler(async (_req, res) => {
  sendSuccess(res, 200, { data: await courseService.getAllCourses() });
});

export const getCourseDetails = asyncHandler(async (req, res) => {
  requireFields(req.body, ["courseId"]);
  sendSuccess(res, 200, { data: await courseService.getCourseDetails(String(req.body.courseId)) });
});

export const getFullCourseDetails = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  sendSuccess(res, 200, { data: await courseService.getFullCourseDetails(user, req.params.courseId) });
});

// Query: ?status=Published|Draft&search=<name>&sort=newest|oldest|students|name (all optional).
export const getInstructorCourses = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  const { status, search, sort } = req.query;

  if (status !== undefined && !COURSE_STATUSES.includes(status as CourseStatus)) {
    throw AppError.badRequest(`status must be one of: ${COURSE_STATUSES.join(", ")}`);
  }
  if (sort !== undefined && !courseService.INSTRUCTOR_COURSE_SORTS.includes(sort as courseService.InstructorCourseSort)) {
    throw AppError.badRequest(`sort must be one of: ${courseService.INSTRUCTOR_COURSE_SORTS.join(", ")}`);
  }

  const result = await courseService.getInstructorCourses(id, {
    status: status as CourseStatus | undefined,
    search: typeof search === "string" ? search.trim().slice(0, 100) : "",
    sort: (sort as courseService.InstructorCourseSort | undefined) ?? "newest",
  });
  sendSuccess(res, 200, { data: result.courses, counts: result.counts });
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  requireFields(req.body, ["courseId"]);

  await courseService.deleteCourse(id, String(req.body.courseId));
  sendSuccess(res, 200, { message: "Course deleted successfully" });
});
