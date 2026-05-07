import { Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import {
  acceptProjectInvite,
  createProject,
  createProjectInvite,
  deleteProject,
  getProjectApiKey,
  listProjects,
  regenerateProjectApiKey
} from "./project.service.js";
import {
  AcceptProjectInviteInput,
  CreateProjectInput,
  CreateProjectInviteInput
} from "./project.validation.js";

export async function listProjectsController(req: Request, res: Response): Promise<void> {
  const projects = await listProjects(req.authSession!.user.id);
  sendSuccess(res, { projects });
}

export async function createProjectController(req: Request, res: Response): Promise<void> {
  const result = await createProject(req.authSession!.user.id, req.body as CreateProjectInput);
  sendSuccess(res, result, 201);
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
