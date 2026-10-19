import { Router } from "express";
import { authenticate, isInstructorOrAdmin } from "../../shared/middlewares/auth";
import * as categoryController from "./category.controller";

export const categoryRoutes = Router();

// Instructors can create a category on the fly while adding a course.
categoryRoutes.post("/createCategory", authenticate, isInstructorOrAdmin, categoryController.createCategory);
categoryRoutes.get("/showAllCategories", categoryController.listCategories);
categoryRoutes.post("/getCategoryPageDetails", categoryController.getCategoryPageDetails);
