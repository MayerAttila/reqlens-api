import { z } from "zod";
import {
  emailAlertAudienceSchema,
  projectMemberRoleSchema
} from "../project/project.validation.js";

const digestTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Digest time must use HH:mm.");
const timezoneSchema = z.string().trim().min(1).refine(isValidTimezone, {
  message: "Digest timezone is invalid."
});

export const updateAccountSettingsSchema = z.object({
  defaultErrorDigestEmailAudience: emailAlertAudienceSchema,
  defaultErrorDigestEmailTime: digestTimeSchema,
  defaultErrorDigestEmailTimezone: timezoneSchema,
  defaultErrorEmailAudience: emailAlertAudienceSchema,
  defaultInviteRole: projectMemberRoleSchema.default("viewer"),
  defaultLatencyEmailAudience: emailAlertAudienceSchema,
  defaultLatencyErrorThresholdMs: z.number().int().min(1).max(60000),
  name: z.string().trim().min(2).max(80)
});

function isValidTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export type UpdateAccountSettingsInput = z.infer<
  typeof updateAccountSettingsSchema
>;
