import { prisma } from "../../config/index.js";
import { defaultLatencyErrorThresholdMs } from "../../constants/latency.js";
import { UpdateAccountSettingsInput } from "./settings.validation.js";

export async function getAccountSettings(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      settings: true
    }
  });

  return {
    settings: normalizeAccountSettings(user.settings),
    user: {
      email: user.email,
      name: user.name
    }
  };
}

export async function updateAccountSettings(
  userId: string,
  input: UpdateAccountSettingsInput
) {
  const [user, settings] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { name: input.name },
      select: {
        email: true,
        name: true
      }
    }),
    prisma.accountSetting.upsert({
      where: { userId },
      update: {
        defaultErrorDigestEmailAudience: input.defaultErrorDigestEmailAudience,
        defaultErrorDigestEmailTime: input.defaultErrorDigestEmailTime,
        defaultErrorDigestEmailTimezone: input.defaultErrorDigestEmailTimezone,
        defaultErrorEmailAudience: input.defaultErrorEmailAudience,
        defaultInviteRole: input.defaultInviteRole,
        defaultLatencyEmailAudience: input.defaultLatencyEmailAudience,
        defaultLatencyErrorThresholdMs: input.defaultLatencyErrorThresholdMs
      },
      create: {
        userId,
        defaultErrorDigestEmailAudience: input.defaultErrorDigestEmailAudience,
        defaultErrorDigestEmailTime: input.defaultErrorDigestEmailTime,
        defaultErrorDigestEmailTimezone: input.defaultErrorDigestEmailTimezone,
        defaultErrorEmailAudience: input.defaultErrorEmailAudience,
        defaultInviteRole: input.defaultInviteRole,
        defaultLatencyEmailAudience: input.defaultLatencyEmailAudience,
        defaultLatencyErrorThresholdMs: input.defaultLatencyErrorThresholdMs
      }
    })
  ]);

  return {
    settings: normalizeAccountSettings(settings),
    user
  };
}

export async function getProjectDefaults(userId: string) {
  const settings = await prisma.accountSetting.findUnique({
    where: { userId }
  });

  return normalizeAccountSettings(settings);
}

function normalizeAccountSettings(
  settings:
    | {
        defaultErrorDigestEmailAudience?: string;
        defaultErrorDigestEmailTime?: string;
        defaultErrorDigestEmailTimezone?: string;
        defaultErrorEmailAudience?: string;
        defaultInviteRole?: string;
        defaultLatencyEmailAudience?: string;
        defaultLatencyErrorThresholdMs?: number;
      }
    | null
    | undefined
) {
  return {
    defaultErrorDigestEmailAudience: normalizeEmailAlertAudience(
      settings?.defaultErrorDigestEmailAudience
    ),
    defaultErrorDigestEmailTime: settings?.defaultErrorDigestEmailTime ?? "08:00",
    defaultErrorDigestEmailTimezone:
      settings?.defaultErrorDigestEmailTimezone ?? "UTC",
    defaultErrorEmailAudience: normalizeEmailAlertAudience(
      settings?.defaultErrorEmailAudience
    ),
    defaultInviteRole: normalizeInviteRole(settings?.defaultInviteRole),
    defaultLatencyEmailAudience: normalizeEmailAlertAudience(
      settings?.defaultLatencyEmailAudience
    ),
    defaultLatencyErrorThresholdMs:
      settings?.defaultLatencyErrorThresholdMs ?? defaultLatencyErrorThresholdMs
  };
}

function normalizeEmailAlertAudience(audience: string | null | undefined) {
  if (
    audience === "all" ||
    audience === "admin_and_above" ||
    audience === "developer_and_above" ||
    audience === "custom"
  ) {
    return audience;
  }

  return "admin_and_above";
}

function normalizeInviteRole(role: string | null | undefined) {
  if (role === "admin" || role === "developer" || role === "viewer") {
    return role;
  }

  return "viewer";
}
