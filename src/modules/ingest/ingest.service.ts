import { prisma } from "../../config/index.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendEmail } from "../../utils/email.js";
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

  void sendLatencyAlertEmail(projectId, input).catch((error) => {
    console.error("[latency-email:error]", error);
  });

  console.log("[ingest]", {
    projectId,
    accepted: input.logs.length
  });

  return { accepted: input.logs.length };
}

async function sendLatencyAlertEmail(projectId: string, input: IngestInput) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      name: true,
      settings: {
        select: {
          latencyEmailEnabled: true,
          latencyEmailRecipient: true,
          latencyErrorThresholdMs: true
        }
      },
      user: {
        select: {
          email: true
        }
      }
    }
  });

  if (!project?.settings?.latencyEmailEnabled) {
    return;
  }

  const thresholdMs = project.settings.latencyErrorThresholdMs;
  const slowLogs = input.logs.filter((log) => log.durationMs >= thresholdMs);

  if (slowLogs.length === 0) {
    return;
  }

  const recipient = project.settings.latencyEmailRecipient ?? project.user.email;
  const sample = slowLogs
    .slice(0, 5)
    .map(
      (log) =>
        `${log.method} ${log.path} - ${log.durationMs} ms - status ${log.statusCode}`
    )
    .join("\n");
  const text = [
    `${slowLogs.length} latency alert(s) were detected for ${project.name}.`,
    `Threshold: ${thresholdMs} ms.`,
    "",
    sample
  ].join("\n");
  const htmlItems = slowLogs
    .slice(0, 5)
    .map(
      (log) =>
        `<li><strong>${escapeHtml(log.method)} ${escapeHtml(log.path)}</strong> - ${log.durationMs} ms - status ${log.statusCode}</li>`
    )
    .join("");

  await sendEmail({
    html: `<p>${slowLogs.length} latency alert(s) were detected for <strong>${escapeHtml(project.name)}</strong>.</p><p>Threshold: ${thresholdMs} ms.</p><ul>${htmlItems}</ul>`,
    subject: `Latency alert for ${project.name}`,
    text,
    to: recipient
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
