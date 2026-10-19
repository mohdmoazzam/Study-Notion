import { Router } from "express";
import { authenticate, isStudent } from "../../shared/middlewares/auth";
import * as paymentController from "./payment.controller";

export const paymentRoutes = Router();

paymentRoutes.use(authenticate, isStudent);

paymentRoutes.post("/capturePayment", paymentController.capturePayment);
paymentRoutes.post("/verifyPayment", paymentController.verifyPayment);
paymentRoutes.post("/sendPaymentSuccessEmail", paymentController.sendPaymentSuccessEmail);
paymentRoutes.get("/history", paymentController.getPurchaseHistory);
