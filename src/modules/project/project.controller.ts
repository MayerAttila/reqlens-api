import { Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import {
  acceptProjectInvite,
  createProject,
  createProjectInvite,
  deleteProject,
  getProjectApiKey,
  listProjects,
  regenerateProjectApiKey,
  removeProjectMember,
  revokeProjectInvite,
  updateProject,
  updateProjectMemberRole
} from "./project.service.js";
import {
  AcceptProjectInviteInput,
  CreateProjectInput,
  CreateProjectInviteInput,
  UpdateProjectMemberRoleInput,
  UpdateProjectInput
} from "./project.validation.js";

export async function listProjectsController(req: Request, res: Response): Promise<void> {
  const projects = await listProjects(req.authSession!.user.id);
  sendSuccess(res, { projects });
}

export async function createProjectController(req: Request, res: Response): Promise<void> {
  const result = await createProject(req.authSession!.user.id, req.body as CreateProjectInput);
  sendSuccess(res, result, 201);
}

export async function updateProjectController(req: Request, res: Response): Promise<void> {
  const result = await updateProject(
    req.authSession!.user.id,
    req.params.projectId,
    req.body as UpdateProjectInput
  );
  sendSuccess(res, result);
}

export async function getProjectApiKeyController(
  req: Request,
  res: Response
): Promise<void> {
  const apiKey = await getProjectApiKey(req.authSession!.user.id, req.params.projectId);
  sendSuccess(res, { apiKey });
}

export async function regenerateProjectApiKeyController(
  req: Request,
  res: Response
): Promise<void> {
  const apiKey = await regenerateProjectApiKey(
    req.authSession!.user.id,
    req.params.projectId
  );
  sendSuccess(res, { apiKey });
}

export async function deleteProjectController(req: Request, res: Response): Promise<void> {
  await deleteProject(req.authSession!.user.id, req.params.projectId);
  sendSuccess(res, { deleted: true });
}

export async function createProjectInviteController(
  req: Request,
  res: Response
): Promise<void> {
  const result = await createProjectInvite(
    req.authSession!.user.id,
    req.params.projectId,
    req.body as CreateProjectInviteInput
  );
  sendSuccess(res, result, 201);
}

export async function acceptProjectInviteController(
  req: Request,
  res: Response
): Promise<void> {
  const result = await acceptProjectInvite(
    req.authSession!.user.id,
    req.body as AcceptProjectInviteInput
  );
  sendSuccess(res, result);
}

export async function removeProjectMemberController(
  req: Request,
  res: Response
): Promise<void> {
  await removeProjectMember(
    req.authSession!.user.id,
    req.params.projectId,
    req.params.memberUserId
  );
  sendSuccess(res, { removed: true });
}

export async function updateProjectMemberRoleController(
  req: Request,
  res: Response
): Promise<void> {
  const result = await updateProjectMemberRole(
    req.authSession!.user.id,
    req.params.projectId,
    req.params.memberUserId,
    req.body as UpdateProjectMemberRoleInput
  );
  sendSuccess(res, result);
}

export async function revokeProjectInviteController(
  req: Request,
  res: Response
): Promise<void> {
  await revokeProjectInvite(
    req.authSession!.user.id,
    req.params.projectId,
    req.params.inviteId
  );
  sendSuccess(res, { revoked: true });
}
