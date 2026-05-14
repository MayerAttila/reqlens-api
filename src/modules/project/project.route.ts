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
  regenerateProjectApiKeyController,
  removeProjectMemberController,
  revokeProjectInviteController,
  updateProjectController,
  updateProjectMemberRoleController,
  updateProjectSettingsController
} from "./project.controller.js";
import {
  acceptProjectInviteSchema,
  createProjectInviteSchema,
  createProjectSchema,
  updateProjectMemberRoleSchema,
  updateProjectSchema,
  updateProjectSettingsSchema
} from "./project.validation.js";

export const projectRouter = Router();

projectRouter.use(authMiddleware);
projectRouter.get("/", catchAsync(listProjectsController));
projectRouter.post("/", validateBody(createProjectSchema), catchAsync(createProjectController));
projectRouter.patch(
  "/:projectId",
  validateBody(updateProjectSchema),
  catchAsync(updateProjectController)
);
projectRouter.patch(
  "/:projectId/settings",
  validateBody(updateProjectSettingsSchema),
  catchAsync(updateProjectSettingsController)
);
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
projectRouter.delete(
  "/:projectId/invites/:inviteId",
  catchAsync(revokeProjectInviteController)
);
projectRouter.delete(
  "/:projectId/members/:memberUserId",
  catchAsync(removeProjectMemberController)
);
projectRouter.patch(
  "/:projectId/members/:memberUserId",
  validateBody(updateProjectMemberRoleSchema),
  catchAsync(updateProjectMemberRoleController)
);
projectRouter.get("/:projectId/api-key", catchAsync(getProjectApiKeyController));
projectRouter.post(
  "/:projectId/api-key/regenerate",
  catchAsync(regenerateProjectApiKeyController)
);
projectRouter.delete("/:projectId", catchAsync(deleteProjectController));
