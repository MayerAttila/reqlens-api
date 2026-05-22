import { env, prisma } from "../../config/index.js";
import { renderAlertEmail } from "../../emails/render-alert-email.js";
import { sendEmail } from "../../utils/email.js";
import { getAlertRecipients } from "./alert-recipients.js";

const digestCheckIntervalMs = 60 * 1000;
const digestWindowMs = 24 * 60 * 60 * 1000;

export function startErrorDigestScheduler() {
  void sendDueErrorDigests().catch(logDigestError);

  const timer = setInterval(() => {
    void sendDueErrorDigests().catch(logDigestError);
  }, digestCheckIntervalMs);

  timer.unref();
}

export async function sendDueErrorDigests(now = new Date()) {
  const projects = await prisma.projectSetting.findMany({
    where: { errorDigestEmailEnabled: true },
    select: {
      id: true,
      errorDigestEmailLastSentAt: true,
      errorDigestEmailTime: true,
      errorDigestEmailTimezone: true,
      errorDigestEmailAudience: true,
      errorDigestEmailCustomUserIds: true,
      errorEmailAudience: true,
      errorEmailCustomUserIds: true,
      errorEmailRecipient: true,
      project: {
        select: {
          id: true,
          name: true,
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
          requestLogs: {
            where: {
              createdAt: { gte: new Date(now.getTime() - digestWindowMs) },
              statusCode: { gte: 400 }
            },
            orderBy: { createdAt: "desc" },
            select: {
              createdAt: true,
              durationMs: true,
              method: true,
              path: true,
              statusCode: true
            }
          },
          user: {
            select: {
              email: true,
              id: true
            }
          }
        }
      }
    }
  });

  for (const settings of projects) {
    if (!isDigestDue(settings, now)) {
      continue;
    }

    try {
      await sendProjectErrorDigest(settings, now);
    } catch (error) {
      console.error("[error-digest:project-error]", {
        error,
        projectId: settings.project.id
      });
    }
  }
}

async function sendProjectErrorDigest(
  settings: DailyErrorDigestSetting,
  now: Date
) {
  const logs = settings.project.requestLogs;
  const recipients = getAlertRecipients({
    audience: settings.errorDigestEmailAudience,
    customUserIds: settings.errorDigestEmailCustomUserIds,
    fallbackEmail: settings.errorEmailRecipient,
    members: settings.project.members,
    owner: settings.project.user
  });

  if (logs.length > 0 && recipients.length > 0) {
    const email = await renderAlertEmail({
      calls: logs.map((log) => ({
        durationMs: log.durationMs,
        method: log.method,
        path: log.path,
        statusCode: log.statusCode,
        timestamp: log.createdAt.toISOString()
      })),
      dashboardUrl: getDashboardAlertUrl(settings.project.id),
      kind: "errors",
      projectName: settings.project.name,
      totalCount: logs.length
    });

    await Promise.all(
      recipients.map((to) =>
        sendEmail({
          html: email.html,
          subject: `Daily API error digest for ${settings.project.name}`,
          text: email.text,
          to
        })
      )
    );
  }

  await prisma.projectSetting.update({
    data: { errorDigestEmailLastSentAt: now },
    where: { id: settings.id }
  });
}

function isDigestDue(
  settings: {
    errorDigestEmailLastSentAt: Date | null;
    errorDigestEmailTime: string;
    errorDigestEmailTimezone: string;
  },
  now: Date
) {
  const localNow = getLocalDigestTime(now, settings.errorDigestEmailTimezone);

  if (localNow.time < settings.errorDigestEmailTime) {
    return false;
  }

  if (!settings.errorDigestEmailLastSentAt) {
    return true;
  }

  const lastSentLocalDate = getLocalDigestTime(
    settings.errorDigestEmailLastSentAt,
    settings.errorDigestEmailTimezone
  ).date;

  return lastSentLocalDate !== localNow.date;
}

function getLocalDigestTime(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric"
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((values, part) => {
      if (part.type !== "literal") {
        values[part.type] = part.value;
      }

      return values;
    }, {});

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`
  };
}

function getDashboardAlertUrl(projectId: string) {
  const params = new URLSearchParams({
    projectId,
    type: "errors"
  });

  return `${env.webOrigin}/dashboard/errors?${params.toString()}`;
}

function logDigestError(error: unknown) {
  console.error("[error-digest:error]", error);
}

type DailyErrorDigestSetting = {
  id: string;
  errorDigestEmailLastSentAt: Date | null;
  errorDigestEmailTime: string;
  errorDigestEmailTimezone: string;
  errorDigestEmailAudience: string;
  errorDigestEmailCustomUserIds: string[];
  errorEmailAudience: string;
  errorEmailCustomUserIds: string[];
  errorEmailRecipient: string | null;
  project: {
    id: string;
    name: string;
    members: Array<{
      role: string;
      user: { email: string; id: string };
    }>;
    requestLogs: Array<{
      createdAt: Date;
      durationMs: number;
      method: string;
      path: string;
      statusCode: number;
    }>;
    user: { email: string; id: string };
  };
};
