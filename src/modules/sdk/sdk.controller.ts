import { Request, Response } from "express";
import {
  getProjectIdForApiKey,
  getProjectSdkConfig,
  getProjectSdkConfigByProjectId
} from "../project/project.service.js";
import { sendSuccess } from "../../utils/response.js";
import { ApiError } from "../../utils/ApiError.js";
import { addProjectSdkConfigClient } from "./sdk-config-publisher.js";

export async function getSdkConfigController(
  req: Request,
  res: Response
): Promise<void> {
  const config = await getProjectSdkConfig(
    req.header("x-reqlens-api-key") ?? undefined
  );

  sendSuccess(res, config);
}

export async function getSdkConfigStreamController(
  req: Request,
  res: Response
): Promise<void> {
  const apiKey = req.header("x-reqlens-api-key") ?? undefined;

  if (!apiKey) {
    throw new ApiError(401, "Invalid API key.");
  }

  const projectId = await getProjectIdForApiKey(apiKey);

  if (!projectId) {
    throw new ApiError(401, "Invalid API key.");
  }

  addProjectSdkConfigClient(
    projectId,
    res,
    await getProjectSdkConfigByProjectId(projectId)
  );
}
