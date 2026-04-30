import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { catchAsync } from "../../utils/catchAsync.js";
import {
  createProjectController,
  getProjectApiKeyController,
  listProjectsController,
  regenerateProjectApiKeyController
} from "./project.controller.js";
import { createProjectSchema } from "./project.validation.js";

export const projectRouter = Router();

projectRouter.use(authMiddleware);
projectRouter.get("/", catchAsync(listProjectsController));
projectRouter.post("/", validateBody(createProjectSchema), catchAsync(createProjectController));
projectRouter.get("/:projectId/api-key", catchAsync(getProjectApiKeyController));
projectRouter.post(
  "/:projectId/api-key/regenerate",
  catchAsync(regenerateProjectApiKeyController)
);
