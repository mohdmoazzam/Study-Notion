import { Router } from "express";
import { authenticate, isInstructor } from "../../shared/middlewares/auth";
import * as profileController from "./profile.controller";

export const profileRoutes = Router();

profileRoutes.use(authenticate);

profileRoutes.get("/getUserDetails", profileController.getUserDetails);
profileRoutes.put("/updateProfile", profileController.updateProfile);
profileRoutes.put("/updateDisplayPicture", profileController.updateDisplayPicture);
profileRoutes.delete("/deleteProfile", profileController.deleteAccount);
profileRoutes.get("/getEnrolledCourses", profileController.getEnrolledCourses);
profileRoutes.get("/instructorDashboard", isInstructor, profileController.getInstructorDashboard);
