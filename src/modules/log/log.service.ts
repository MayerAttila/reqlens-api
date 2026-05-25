import { Prisma } from "../../../node_modules/.prisma/client/index.js";
import { prisma } from "../../config/index.js";
import { ApiError } from "../../utils/ApiError.js";
import { getAccessibleProjectWhere } from "../project/project.service.js";

type ListLogsByProjectOptions = {
  errorsOnly?: boolean;
};

type ProblemTypeFilter = "all" | "errors" | "latency";

type ListLogEntriesOptions = {
  cursor?: string;
  limit?: number;
  problemType?: ProblemTypeFilter;
  projectId?: string;
  search?: string;
};

type LogEntryRow = {
  created_at: Date;
  duration_ms: number;
  error_message: string | null;
  id: string;
  latency_error_threshold_ms: number | null;
  method: string;
  path: string;
  project_id: string;
  project_name: string;
  status_code: number;
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

export async function listLogEntries(
  userId: string,
  options: ListLogEntriesOptions = {}
) {
  const limit = Math.min(Math.max(options.limit ?? 250, 1), 250);
  const cursor = decodeCursor(options.cursor);
  const rows = await prisma.$queryRaw<LogEntryRow[]>`
    SELECT
      rl.id,
      rl.project_id,
      p.name AS project_name,
      rl.method,
      rl.path,
      rl.status_code,
      rl.duration_ms,
      rl.error_message,
      rl.created_at,
      ps.latency_error_threshold_ms
    FROM request_logs rl
    INNER JOIN projects p ON p.id = rl.project_id
    LEFT JOIN project_settings ps ON ps.project_id = p.id
    LEFT JOIN project_members pm
      ON pm.project_id = p.id AND pm.user_id = ${userId}
    WHERE
      (p.user_id = ${userId} OR pm.user_id = ${userId})
      ${options.projectId && options.projectId !== "all"
        ? Prisma.sql`AND rl.project_id = ${options.projectId}`
        : Prisma.empty}
      ${cursor
        ? Prisma.sql`AND (rl.created_at, rl.id) < (${cursor.createdAt}, ${cursor.id})`
        : Prisma.empty}
      ${options.search
        ? Prisma.sql`AND (
            p.name ILIKE ${`%${options.search}%`}
            OR rl.method ILIKE ${`%${options.search}%`}
            OR rl.path ILIKE ${`%${options.search}%`}
            OR CAST(rl.status_code AS TEXT) ILIKE ${`%${options.search}%`}
            OR CAST(rl.duration_ms AS TEXT) ILIKE ${`%${options.search}%`}
          )`
        : Prisma.empty}
      ${getProblemSql(options.problemType)}
    ORDER BY rl.created_at DESC, rl.id DESC
    LIMIT ${limit + 1}
  `;
  const pageRows = rows.slice(0, limit);
  const nextRow = rows[limit];

  return {
    logs: pageRows.map(mapLogEntryRow),
    nextCursor: nextRow
      ? encodeCursor({ createdAt: nextRow.created_at, id: nextRow.id })
      : null
  };
}

export async function getLogDetail(userId: string, logId: string) {
  const log = await prisma.requestLog.findFirst({
    where: {
      id: logId,
      project: getAccessibleProjectWhere(userId)
    },
    select: {
      id: true,
      requestBody: true,
      responseBody: true
    }
  });

  if (!log) {
    throw new ApiError(404, "Request log not found.");
  }

  return log;
}

function getProblemSql(problemType: ProblemTypeFilter | undefined) {
  if (problemType === "errors") {
    return Prisma.sql`AND rl.status_code >= 400`;
  }

  if (problemType === "latency") {
    return Prisma.sql`AND rl.duration_ms >= COALESCE(ps.latency_error_threshold_ms, 750)`;
  }

  if (problemType === "all") {
    return Prisma.sql`AND (
      rl.status_code >= 400
      OR rl.duration_ms >= COALESCE(ps.latency_error_threshold_ms, 750)
    )`;
  }

  return Prisma.empty;
}

function mapLogEntryRow(row: LogEntryRow) {
  return {
    createdAt: row.created_at,
    durationMs: row.duration_ms,
    errorMessage: row.error_message,
    id: row.id,
    latencyErrorThresholdMs: row.latency_error_threshold_ms ?? 750,
    method: row.method,
    path: row.path,
    projectId: row.project_id,
    projectName: row.project_name,
    statusCode: row.status_code
  };
}

function encodeCursor(cursor: { createdAt: Date; id: string }) {
  return Buffer.from(
    JSON.stringify({
      createdAt: cursor.createdAt.toISOString(),
      id: cursor.id
    })
  ).toString("base64url");
}

function decodeCursor(cursor: string | undefined) {
  if (!cursor) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as {
      createdAt?: string;
      id?: string;
    };

    if (!decoded.createdAt || !decoded.id) {
      return null;
    }

    const createdAt = new Date(decoded.createdAt);

    if (Number.isNaN(createdAt.getTime())) {
      return null;
    }

    return { createdAt, id: decoded.id };
  } catch {
    return null;
  }
}
