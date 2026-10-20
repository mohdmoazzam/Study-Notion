import { Router } from "express";
import { authenticate } from "../../shared/middlewares/auth";
import * as notificationController from "./notification.controller";

export const notificationRoutes = Router();

notificationRoutes.use(authenticate);

notificationRoutes.get("/", notificationController.listNotifications);
notificationRoutes.get("/unread-count", notificationController.getUnreadCount);
notificationRoutes.get("/stream", notificationController.streamNotifications);
notificationRoutes.patch("/read-all", notificationController.markAllRead);
notificationRoutes.patch("/:id/read", notificationController.markRead);
