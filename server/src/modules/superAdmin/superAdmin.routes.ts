import { Router } from "express";
import { adminCoupons } from "../coupons/coupon.controller";
import * as payoutController from "../payouts/payout.controller";
import * as superAdminController from "./superAdmin.controller";

export const superAdminRoutes = Router();

superAdminRoutes.post("/login", superAdminController.logIn);

superAdminRoutes.use(superAdminController.authenticateSuperAdmin);
superAdminRoutes.get("/session", superAdminController.getSession);

// Payout requests
superAdminRoutes.get("/payouts", payoutController.getAllPayouts);
superAdminRoutes.patch("/payouts/:payoutId", payoutController.processPayout);
superAdminRoutes.get("/payouts/:payoutId/receipt", payoutController.getReceiptUrl);

// Coupons: site-wide, or limited to one instructor's courses or to chosen courses
superAdminRoutes.get("/coupons", adminCoupons.list);
superAdminRoutes.post("/coupons", adminCoupons.create);
superAdminRoutes.patch("/coupons/:couponId", adminCoupons.update);
superAdminRoutes.delete("/coupons/:couponId", adminCoupons.remove);
