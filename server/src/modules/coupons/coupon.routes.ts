import { Router } from "express";
import { authenticate, isInstructor } from "../../shared/middlewares/auth";
import { getOffers, instructorCoupons } from "./coupon.controller";

export const couponRoutes = Router();

// Public, so course pages can show offers to visitors who aren't logged in. Registered before the
// auth middleware below so that middleware doesn't apply to it.
couponRoutes.get("/offers", getOffers);

// Instructors' own coupons. Students apply coupons through /payment/applyCoupon; the super admin
// manages every coupon from the console (see superAdmin.routes.ts).
couponRoutes.use(authenticate, isInstructor);

couponRoutes.get("/", instructorCoupons.list);
couponRoutes.post("/", instructorCoupons.create);
couponRoutes.patch("/:couponId", instructorCoupons.update);
couponRoutes.delete("/:couponId", instructorCoupons.remove);
