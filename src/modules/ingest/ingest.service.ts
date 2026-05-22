import { Prisma } from "../../../node_modules/.prisma/client/index.js";
import { env, prisma } from "../../config/index.js";
import { renderOneTimeAlertEmail } from "../../emails/render-one-time-alert-email.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendEmail } from "../../utils/email.js";
import { getAlertRecipients } from "../alerts/alert-recipients.js";
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
      requestBody: toPrismaJson(log.requestBody),
      responseBody: toPrismaJson(log.responseBody),
      createdAt: new Date(log.timestamp)
    }))
  });

  void sendLatencyAlertEmail(projectId, input).catch((error) => {
    console.error("[latency-email:error]", error);
  });
  void sendErrorAlertEmail(projectId, input).catch((error) => {
    console.error("[error-email:error]", error);
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
          latencyEmailAudience: true,
          latencyEmailCustomUserIds: true,
          latencyEmailEnabled: true,
          latencyEmailRecipient: true,
          latencyErrorThresholdMs: true
        }
      },
      members: {
        select: {
          role: true,
          user: {
            select: {
              email: true,
              id: true
            }
          }
        }
      },
      user: {
        select: {
          email: true,
          id: true
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

  const recipients = getAlertRecipients({
    audience: project.settings.latencyEmailAudience,
    customUserIds: project.settings.latencyEmailCustomUserIds,
    fallbackEmail: project.settings.latencyEmailRecipient,
    members: project.members,
    owner: project.user
  });

  if (recipients.length === 0) {
    return;
  }
  const email = await renderOneTimeAlertEmail({
    calls: slowLogs.slice(0, 5).map(toAlertEmailCall),
    dashboardUrl: getDashboardAlertUrl(projectId, "latency"),
    kind: "latency",
    projectName: project.name,
    totalCount: slowLogs.length
  });

  await Promise.all(
    recipients.map((to) =>
      sendEmail({
        html: email.html,
        subject: `Latency alert for ${project.name}`,
        text: email.text,
        to
      })
    )
  );
}

async function sendErrorAlertEmail(projectId: string, input: IngestInput) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      name: true,
      settings: {
        select: {
          errorEmailAudience: true,
          errorEmailCustomUserIds: true,
          errorEmailEnabled: true,
          errorEmailRecipient: true
        }
      },
      members: {
        select: {
          role: true,
          user: {
            select: {
              email: true,
              id: true
            }
          }
        }
      },
      user: {
        select: {
          email: true,
          id: true
        }
      }
    }
  });

  if (!project?.settings?.errorEmailEnabled) {
    return;
  }

  const erroredLogs = input.logs.filter((log) => log.statusCode >= 400);

  if (erroredLogs.length === 0) {
    return;
  }

  const recipients = getAlertRecipients({
    audience: project.settings.errorEmailAudience,
    customUserIds: project.settings.errorEmailCustomUserIds,
    fallbackEmail: project.settings.errorEmailRecipient,
    members: project.members,
    owner: project.user
  });

  if (recipients.length === 0) {
    return;
  }
  const email = await renderOneTimeAlertEmail({
    calls: erroredLogs.slice(0, 5).map(toAlertEmailCall),
    dashboardUrl: getDashboardAlertUrl(projectId, "errors"),
    kind: "errors",
    projectName: project.name,
    totalCount: erroredLogs.length
  });

  await Promise.all(
    recipients.map((to) =>
      sendEmail({
        html: email.html,
        subject: `API error alert for ${project.name}`,
        text: email.text,
        to
      })
    )
  );
}

function getDashboardAlertUrl(projectId: string, type: "errors" | "latency") {
  const params = new URLSearchParams({
    projectId,
    type
  });

  return `${env.webOrigin}/dashboard/errors?${params.toString()}`;
}

function toAlertEmailCall(log: IngestInput["logs"][number]) {
  return {
    durationMs: log.durationMs,
    method: log.method,
    path: log.path,
    statusCode: log.statusCode,
    timestamp: log.timestamp
  };
}

function toPrismaJson(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}
