import { Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import { ingestLogs } from "./ingest.service.js";
import { IngestInput } from "./ingest.validation.js";

export async function ingestController(req: Request, res: Response): Promise<void> {
  const result = await ingestLogs(
    req.header("x-reqlens-api-key") ?? undefined,
    req.body as IngestInput
  );
  sendSuccess(res, result, 202);
}
