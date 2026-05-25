import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { catchAsync } from "../../utils/catchAsync.js";
import {
  getAccountSettingsController,
  updateAccountSettingsController
} from "./settings.controller.js";
import { updateAccountSettingsSchema } from "./settings.validation.js";

export const settingsRouter = Router();

settingsRouter.use(authMiddleware);
settingsRouter.get("/", catchAsync(getAccountSettingsController));
settingsRouter.patch(
  "/",
  validateBody(updateAccountSettingsSchema),
  catchAsync(updateAccountSettingsController)
);
