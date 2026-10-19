import { Router } from "express";
import { authenticate, isAdmin } from "../../shared/middlewares/auth";
import * as categoryController from "./category.controller";

export const categoryRoutes = Router();

categoryRoutes.post("/createCategory", authenticate, isAdmin, categoryController.createCategory);
categoryRoutes.get("/showAllCategories", categoryController.listCategories);
categoryRoutes.post("/getCategoryPageDetails", categoryController.getCategoryPageDetails);
