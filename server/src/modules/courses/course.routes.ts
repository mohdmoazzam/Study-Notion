import { Router } from "express";
import { authenticate, isInstructor } from "../../shared/middlewares/auth";
import * as courseController from "./course.controller";
import * as sectionController from "./section.controller";
import * as subSectionController from "./subSection.controller";

export const courseRoutes = Router();

// Courses
courseRoutes.get("/getAllCourses", courseController.getAllCourses);
courseRoutes.post("/getCourseDetails", courseController.getCourseDetails);
courseRoutes.get("/getFullCourseDetails/:courseId", authenticate, courseController.getFullCourseDetails);
courseRoutes.post("/createCourse", authenticate, isInstructor, courseController.createCourse);
courseRoutes.patch("/editCourse", authenticate, isInstructor, courseController.editCourse);
courseRoutes.delete("/deleteCourse", authenticate, isInstructor, courseController.deleteCourse);
courseRoutes.get("/getInstructorCourses", authenticate, isInstructor, courseController.getInstructorCourses);

// Sections
courseRoutes.post("/addSection", authenticate, isInstructor, sectionController.createSection);
courseRoutes.patch("/updateSection", authenticate, isInstructor, sectionController.updateSection);
courseRoutes.delete("/deleteSection", authenticate, isInstructor, sectionController.deleteSection);

// Lectures (sub-sections)
courseRoutes.post("/addSubSection", authenticate, isInstructor, subSectionController.createSubSection);
courseRoutes.patch("/updateSubSection", authenticate, isInstructor, subSectionController.updateSubSection);
courseRoutes.delete("/deleteSubSection", authenticate, isInstructor, subSectionController.deleteSubSection);
