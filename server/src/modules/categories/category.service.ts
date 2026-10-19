import type { Types } from "mongoose";
import { AppError } from "../../shared/errors";
import { Course } from "../courses/course.model";
import { Category } from "./category.model";

const PUBLISHED_COURSES = { path: "course", match: { status: "Published" } };
const TOP_SELLING_LIMIT = 10;

export const createCategory = (name: string, description: string) => Category.create({ name, description });

export const listCategories = () => Category.find({}).lean();

const getRandomCategoryExcept = async (excludeId: Types.ObjectId) => {
  const [random] = await Category.aggregate<{ _id: Types.ObjectId }>([
    { $match: { _id: { $ne: excludeId } } },
    { $sample: { size: 1 } },
    { $project: { _id: 1 } },
  ]);
  return random ? Category.findById(random._id).populate(PUBLISHED_COURSES).lean() : null;
};

const getMostSellingCourses = async () => {
  const courses = await Course.aggregate([
    { $match: { status: "Published" } },
    { $addFields: { sold: { $size: { $ifNull: ["$studentsEnrolled", []] } } } },
    { $sort: { sold: -1 } },
    { $limit: TOP_SELLING_LIMIT },
  ]);
  return Course.populate(courses, { path: "instructor", select: "firstName lastName image" });
};

export const getCategoryPageDetails = async (categoryId: string) => {
  const selectedCategory = await Category.findById(categoryId)
    .populate({ ...PUBLISHED_COURSES, populate: "ratingAndReviews" })
    .lean();

  // A category without published courses is still a valid page; the client shows an empty state.
  if (!selectedCategory) {
    throw AppError.notFound("Category not found");
  }

  const [differentCategory, mostSellingCourses] = await Promise.all([
    getRandomCategoryExcept(selectedCategory._id),
    getMostSellingCourses(),
  ]);

  return { selectedCategory, differentCategory, mostSellingCourses };
};
