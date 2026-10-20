import { Router } from "express";
import { authRoutes } from "./modules/auth/auth.routes";
import { categoryRoutes } from "./modules/categories/category.routes";
import { contactRoutes } from "./modules/contact/contact.routes";
import { couponRoutes } from "./modules/coupons/coupon.routes";
import { courseRoutes } from "./modules/courses/course.routes";
import { notificationRoutes } from "./modules/notifications/notification.routes";
import { paymentRoutes } from "./modules/payments/payment.routes";
import { payoutRoutes } from "./modules/payouts/payout.routes";
import { progressRoutes } from "./modules/progress/progress.routes";
import { reviewRoutes } from "./modules/reviews/review.routes";
import { superAdminRoutes } from "./modules/superAdmin/superAdmin.routes";
import { profileRoutes } from "./modules/users/profile.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/profile", profileRoutes);
// Several modules share the /course prefix to keep the public API unchanged.
apiRouter.use("/course", courseRoutes, categoryRoutes, reviewRoutes, progressRoutes);
apiRouter.use("/payment", paymentRoutes);
apiRouter.use("/payout", payoutRoutes);
apiRouter.use("/coupon", couponRoutes);
apiRouter.use("/reach", contactRoutes);
apiRouter.use("/super-admin", superAdminRoutes);
apiRouter.use("/notifications", notificationRoutes);
