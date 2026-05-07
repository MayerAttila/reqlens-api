import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { catchAsync } from "../../utils/catchAsync.js";
import {
  acceptProjectInviteController,
  createProjectController,
  createProjectInviteController,
  deleteProjectController,
  getProjectApiKeyController,
  listProjectsController,
  regenerateProjectApiKeyController
} from "./project.controller.js";
import {
  acceptProjectInviteSchema,
  createProjectInviteSchema,
  createProjectSchema
} from "./project.validation.js";

export const projectRouter = Router();

projectRouter.use(authMiddleware);
projectRouter.get("/", catchAsync(listProjectsController));
projectRouter.post("/", validateBody(createProjectSchema), catchAsync(createProjectController));
projectRouter.post(
  "/invites/accept",
  validateBody(acceptProjectInviteSchema),
  catchAsync(acceptProjectInviteController)
);
projectRouter.post(
  "/:projectId/invites",
  validateBody(createProjectInviteSchema),
  catchAsync(createProjectInviteController)
);
projectRouter.get("/:projectId/api-key", catchAsync(getProjectApiKeyController));
projectRouter.post(
  "/:projectId/api-key/regenerate",
  catchAsync(regenerateProjectApiKeyController)
);
projectRouter.delete("/:projectId", catchAsync(deleteProjectController));
