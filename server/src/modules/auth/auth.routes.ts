import { Router } from "express";
import { authenticate } from "../../shared/middlewares/auth";
import * as authController from "./auth.controller";

export const authRoutes = Router();

authRoutes.post("/login", authController.logIn);
authRoutes.post("/signup", authController.signUp);
authRoutes.post("/sendotp", authController.sendOtp);
authRoutes.post("/changepassword", authenticate, authController.changePassword);
authRoutes.post("/reset-password-token", authController.requestPasswordReset);
authRoutes.post("/reset-password", authController.resetPassword);
