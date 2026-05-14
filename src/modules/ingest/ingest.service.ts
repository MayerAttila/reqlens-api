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

  await Promise.all(
    recipients.map((to) =>
      sendEmail({
        html: `<p>${slowLogs.length} latency alert(s) were detected for <strong>${escapeHtml(project.name)}</strong>.</p><p>Threshold: ${thresholdMs} ms.</p><ul>${htmlItems}</ul>`,
        subject: `Latency alert for ${project.name}`,
        text,
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
  const sample = erroredLogs
    .slice(0, 5)
    .map(
      (log) =>
        `${log.method} ${log.path} - status ${log.statusCode} - ${log.durationMs} ms`
    )
    .join("\n");
  const text = [
    `${erroredLogs.length} errored API call(s) were detected for ${project.name}.`,
    "",
    sample
  ].join("\n");
  const htmlItems = erroredLogs
    .slice(0, 5)
    .map(
      (log) =>
        `<li><strong>${escapeHtml(log.method)} ${escapeHtml(log.path)}</strong> - status ${log.statusCode} - ${log.durationMs} ms</li>`
    )
    .join("");

  await Promise.all(
    recipients.map((to) =>
      sendEmail({
        html: `<p>${erroredLogs.length} errored API call(s) were detected for <strong>${escapeHtml(project.name)}</strong>.</p><ul>${htmlItems}</ul>`,
        subject: `API error alert for ${project.name}`,
        text,
        to
      })
    )
  );
}

function getAlertRecipients({
  audience,
  customUserIds,
  fallbackEmail,
  members,
  owner
}: {
  audience: string;
  customUserIds: string[];
  fallbackEmail: string | null;
  members: Array<{ role: string; user: { email: string; id: string } }>;
  owner: { email: string; id: string };
}) {
  const users = [
    { email: owner.email, id: owner.id, role: "owner" },
    ...members.map((member) => ({
      email: member.user.email,
      id: member.user.id,
      role: member.role
    }))
  ];

  const recipients =
    audience === "all"
      ? users.map((user) => user.email)
      : audience === "custom"
        ? users
            .filter((user) => customUserIds.includes(user.id))
            .map((user) => user.email)
        : audience === "developer_and_above"
          ? users
              .filter(
                (user) =>
                  user.role === "owner" ||
                  user.role === "admin" ||
                  user.role === "developer"
              )
              .map((user) => user.email)
        : users
            .filter((user) => user.role === "owner" || user.role === "admin")
            .map((user) => user.email);

  if (recipients.length === 0 && fallbackEmail) {
    recipients.push(fallbackEmail);
  }

  return Array.from(new Set(recipients));
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
