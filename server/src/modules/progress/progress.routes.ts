import { Router } from "express";
import { authenticate, isStudent } from "../../shared/middlewares/auth";
import * as progressController from "./progress.controller";

export const progressRoutes = Router();

progressRoutes.post("/updateCourseProgress", authenticate, isStudent, progressController.updateCourseProgress);
