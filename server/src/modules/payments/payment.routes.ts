import { Router } from "express";
import { authenticate, isStudent } from "../../shared/middlewares/auth";
import * as paymentController from "./payment.controller";

export const paymentRoutes = Router();

// Called by Razorpay, not a signed-in user; it authenticates with a signature instead.
// Registered before the auth middleware below so that middleware doesn't apply to it.
paymentRoutes.post("/webhook", paymentController.razorpayWebhook);
// Public, so course pages can mention the platform fee to visitors who aren't logged in.
paymentRoutes.get("/config", paymentController.getCheckoutConfig);

paymentRoutes.use(authenticate, isStudent);

paymentRoutes.post("/applyCoupon", paymentController.applyCoupon);
paymentRoutes.post("/capturePayment", paymentController.capturePayment);
paymentRoutes.post("/verifyPayment", paymentController.verifyPayment);
paymentRoutes.post("/sendPaymentSuccessEmail", paymentController.sendPaymentSuccessEmail);
paymentRoutes.get("/history", paymentController.getPurchaseHistory);
