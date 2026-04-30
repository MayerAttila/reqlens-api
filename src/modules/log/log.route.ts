import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { listLogsController } from "./log.controller.js";

export const logRouter = Router();

logRouter.use(authMiddleware);
logRouter.get("/", catchAsync(listLogsController));
