import { Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import { listLogsByProject } from "./log.service.js";

export async function listLogsController(req: Request, res: Response): Promise<void> {
  const projects = await listLogsByProject(req.authSession!.user.id);
  sendSuccess(res, { projects });
}
