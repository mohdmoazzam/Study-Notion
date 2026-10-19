import { Router } from "express";
import { authenticate, isInstructor } from "../../shared/middlewares/auth";
import * as payoutController from "./payout.controller";

export const payoutRoutes = Router();

payoutRoutes.use(authenticate);

// Instructor withdrawals
payoutRoutes.get("/requests", isInstructor, payoutController.getMyPayouts);
payoutRoutes.post("/requests", isInstructor, payoutController.createPayout);
payoutRoutes.patch("/requests/:payoutId/cancel", isInstructor, payoutController.cancelPayout);
payoutRoutes.get("/requests/:payoutId/receipt", isInstructor, payoutController.getMyReceiptUrl);
payoutRoutes.get("/ifsc/:ifsc", isInstructor, payoutController.lookupIfsc);
// Processing requests lives in the super admin console (see superAdmin.routes.ts).
