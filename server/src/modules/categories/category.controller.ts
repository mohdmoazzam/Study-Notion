import { asyncHandler, sendSuccess } from "../../shared/http";
import { requireFields } from "../../shared/request";
import * as categoryService from "./category.service";

export const createCategory = asyncHandler(async (req, res) => {
  requireFields(req.body, ["name", "description"]);
  const category = await categoryService.createCategory(req.body.name, req.body.description);
  sendSuccess(res, 201, { message: "Category created successfully", data: category });
});

export const listCategories = asyncHandler(async (_req, res) => {
  sendSuccess(res, 200, { data: await categoryService.listCategories() });
});

export const getCategoryPageDetails = asyncHandler(async (req, res) => {
  requireFields(req.body, ["categoryId"]);
  sendSuccess(res, 200, { data: await categoryService.getCategoryPageDetails(String(req.body.categoryId)) });
});
