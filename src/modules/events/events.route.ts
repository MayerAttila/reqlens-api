import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { streamDashboardEventsController } from "./events.controller.js";

export const eventsRouter = Router();

eventsRouter.use(authMiddleware);
eventsRouter.get("/", catchAsync(streamDashboardEventsController));
