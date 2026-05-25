import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { catchAsync } from "../../utils/catchAsync.js";
import {
  getLogDetailController,
  listLogEntriesController,
  listLogsController
} from "./log.controller.js";

export const logRouter = Router();

logRouter.use(authMiddleware);
logRouter.get("/entries", catchAsync(listLogEntriesController));
logRouter.get("/:logId", catchAsync(getLogDetailController));
logRouter.get("/", catchAsync(listLogsController));
