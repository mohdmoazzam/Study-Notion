import { Router } from "express";
import { authRoutes } from "./modules/auth/auth.routes";
import { categoryRoutes } from "./modules/categories/category.routes";
import { contactRoutes } from "./modules/contact/contact.routes";
import { courseRoutes } from "./modules/courses/course.routes";
import { paymentRoutes } from "./modules/payments/payment.routes";
import { progressRoutes } from "./modules/progress/progress.routes";
import { reviewRoutes } from "./modules/reviews/review.routes";
import { profileRoutes } from "./modules/users/profile.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/profile", profileRoutes);
// Several modules share the /course prefix to keep the public API unchanged.
apiRouter.use("/course", courseRoutes, categoryRoutes, reviewRoutes, progressRoutes);
apiRouter.use("/payment", paymentRoutes);
apiRouter.use("/reach", contactRoutes);
