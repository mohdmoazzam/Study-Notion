import { AppError } from "../../shared/errors";
import { asyncHandler, sendSuccess } from "../../shared/http";
import { requireFields } from "../../shared/request";
import * as categoryService from "./category.service";

const MAX_CATEGORY_NAME_LENGTH = 50;

export const createCategory = asyncHandler(async (req, res) => {
  requireFields(req.body, ["name"], "Category name is required");
  const name = String(req.body.name).trim();
  if (name.length < 2 || name.length > MAX_CATEGORY_NAME_LENGTH) {
    throw AppError.badRequest(`Category name must be 2-${MAX_CATEGORY_NAME_LENGTH} characters`);
  }

  const { category, created } = await categoryService.createCategory(name, String(req.body.description ?? ""));
  sendSuccess(res, created ? 201 : 200, {
    message: created ? "Category created successfully" : "Category already exists",
    data: category,
  });
});

export const listCategories = asyncHandler(async (_req, res) => {
  sendSuccess(res, 200, { data: await categoryService.listCategories() });
});

export const getCategoryPageDetails = asyncHandler(async (req, res) => {
  requireFields(req.body, ["categoryId"]);
  sendSuccess(res, 200, { data: await categoryService.getCategoryPageDetails(String(req.body.categoryId)) });
});
