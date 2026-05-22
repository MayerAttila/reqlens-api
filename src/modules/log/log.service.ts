import { prisma } from "../../config/index.js";
import { getAccessibleProjectWhere } from "../project/project.service.js";

type ListLogsByProjectOptions = {
  errorsOnly?: boolean;
};

export async function listLogsByProject(
  userId: string,
  options: ListLogsByProjectOptions = {}
) {
  const logWhere = options.errorsOnly
    ? {
        statusCode: {
          gte: 400
        }
      }
    : undefined;

  const projects = await prisma.project.findMany({
    where: getAccessibleProjectWhere(userId),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyHash: true,
      settings: {
        select: {
          errorEmailAudience: true,
          errorEmailCustomUserIds: true,
          errorDigestEmailEnabled: true,
          errorDigestEmailAudience: true,
          errorDigestEmailCustomUserIds: true,
          errorDigestEmailTime: true,
          errorDigestEmailTimezone: true,
          errorEmailEnabled: true,
          errorEmailRecipient: true,
          latencyEmailAudience: true,
          latencyEmailCustomUserIds: true,
          latencyEmailEnabled: true,
          latencyEmailRecipient: true,
          latencyErrorThresholdMs: true
        }
      },
      requestLogs: {
        where: logWhere,
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          method: true,
          path: true,
          statusCode: true,
          durationMs: true,
          errorMessage: true,
          requestBody: true,
          responseBody: true,
          createdAt: true
        }
      }
    }
  });

  return projects.map((project) => ({
    projectId: project.id,
    projectName: project.name,
    hasApiKey: Boolean(project.keyHash),
    settings: {
      errorEmailAudience: project.settings?.errorEmailAudience ?? "admin_and_above",
      errorEmailCustomUserIds: project.settings?.errorEmailCustomUserIds ?? [],
      errorDigestEmailEnabled: project.settings?.errorDigestEmailEnabled ?? false,
      errorDigestEmailAudience:
        project.settings?.errorDigestEmailAudience ?? "admin_and_above",
      errorDigestEmailCustomUserIds:
        project.settings?.errorDigestEmailCustomUserIds ?? [],
      errorDigestEmailTime: project.settings?.errorDigestEmailTime ?? "08:00",
      errorDigestEmailTimezone: project.settings?.errorDigestEmailTimezone ?? "UTC",
      errorEmailEnabled: project.settings?.errorEmailEnabled ?? false,
      errorEmailRecipient: project.settings?.errorEmailRecipient ?? null,
      latencyEmailAudience:
        project.settings?.latencyEmailAudience ?? "admin_and_above",
      latencyEmailCustomUserIds:
        project.settings?.latencyEmailCustomUserIds ?? [],
      latencyEmailEnabled: project.settings?.latencyEmailEnabled ?? false,
      latencyEmailRecipient: project.settings?.latencyEmailRecipient ?? null,
      latencyErrorThresholdMs: project.settings?.latencyErrorThresholdMs ?? 750
    },
    logs: project.requestLogs
  }));
}
