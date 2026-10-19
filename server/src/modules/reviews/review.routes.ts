import { Router } from "express";
import { authenticate, isStudent } from "../../shared/middlewares/auth";
import * as reviewController from "./review.controller";

export const reviewRoutes = Router();

reviewRoutes.post("/createRating", authenticate, isStudent, reviewController.createRating);
reviewRoutes.get("/getAverageRating", reviewController.getAverageRating);
reviewRoutes.get("/getReviews", reviewController.getAllRatings);
