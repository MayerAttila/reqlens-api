import { Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import {
  getLogDetail,
  listLogEntries,
  listLogsByProject
} from "./log.service.js";

export async function listLogsController(req: Request, res: Response): Promise<void> {
  const projects = await listLogsByProject(req.authSession!.user.id, {
    errorsOnly: req.query.level === "errors",
    since: dateQuery(req.query.since)
  });
  sendSuccess(res, { projects });
}

export async function listLogEntriesController(
  req: Request,
  res: Response
): Promise<void> {
  const result = await listLogEntries(req.authSession!.user.id, {
    cursor: stringQuery(req.query.cursor),
    limit: numberQuery(req.query.limit),
    problemType: problemTypeQuery(req.query.problemType),
    projectId: stringQuery(req.query.projectId),
    search: stringQuery(req.query.search)
  });

  sendSuccess(res, result);
}

export async function getLogDetailController(
  req: Request,
  res: Response
): Promise<void> {
  const log = await getLogDetail(req.authSession!.user.id, req.params.logId);

  sendSuccess(res, { log });
}

function stringQuery(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberQuery(value: unknown) {
  const parsed = typeof value === "string" ? Number(value) : NaN;

  return Number.isFinite(parsed) ? parsed : undefined;
}

function dateQuery(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function problemTypeQuery(value: unknown) {
  return value === "all" || value === "errors" || value === "latency"
    ? value
    : undefined;
}
