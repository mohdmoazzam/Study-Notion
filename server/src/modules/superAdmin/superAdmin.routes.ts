import { Router } from "express";
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
