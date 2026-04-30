import { prisma } from "../../config/index.js";
import { ApiError } from "../../utils/ApiError.js";
import { getProjectIdForApiKey } from "../project/project.service.js";
import { IngestInput } from "./ingest.validation.js";

export async function ingestLogs(apiKey: string | undefined, input: IngestInput) {
  if (!apiKey) {
    throw new ApiError(401, "Invalid API key.");
  }

  const projectId = await getProjectIdForApiKey(apiKey);

  if (!projectId) {
    throw new ApiError(401, "Invalid API key.");
  }

  await prisma.requestLog.createMany({
    data: input.logs.map((log) => ({
      projectId,
      method: log.method,
      path: log.path,
      statusCode: log.statusCode,
      durationMs: log.durationMs,
      createdAt: new Date(log.timestamp)
    }))
  });

  console.log("[ingest]", {
    projectId,
    accepted: input.logs.length
  });

  return { accepted: input.logs.length };
}
