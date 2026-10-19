import { Router } from "express";
import * as contactController from "./contact.controller";

export const contactRoutes = Router();

contactRoutes.post("/contact", contactController.handleContactUs);
