import { Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import {
  getAccountSettings,
  updateAccountSettings
} from "./settings.service.js";
import { UpdateAccountSettingsInput } from "./settings.validation.js";

export async function getAccountSettingsController(
  req: Request,
  res: Response
): Promise<void> {
  const result = await getAccountSettings(req.authSession!.user.id);

  sendSuccess(res, result);
}

export async function updateAccountSettingsController(
  req: Request,
  res: Response
): Promise<void> {
  const result = await updateAccountSettings(
    req.authSession!.user.id,
    req.body as UpdateAccountSettingsInput
  );

  sendSuccess(res, result);
}
