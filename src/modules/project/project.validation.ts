import { z } from "zod";

export const projectMemberRoleSchema = z.enum(["admin", "developer", "viewer"]);
export const emailAlertAudienceSchema = z.enum([
  "all",
  "admin_and_above",
  "developer_and_above",
  "custom"
]);
const digestTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Digest time must use HH:mm.");
const timezoneSchema = z.string().trim().min(1).refine(isValidTimezone, {
  message: "Digest timezone is invalid."
});

export const createProjectSchema = z.object({
  description: z.string().trim().max(240).optional(),
  name: z.string().trim().min(2).max(80)
});

export const updateProjectSchema = z.object({
  description: z.string().trim().max(240).optional(),
  name: z.string().trim().min(2).max(80)
});

export const createProjectInviteSchema = z.object({
  email: z.email().trim().toLowerCase()
});

export const updateProjectMemberRoleSchema = z.object({
  role: projectMemberRoleSchema
});

export const updateProjectSettingsSchema = z.object({
  errorDigestEmailEnabled: z.boolean().default(false),
  errorDigestEmailAudience: emailAlertAudienceSchema.default("admin_and_above"),
  errorDigestEmailCustomUserIds: z.array(z.string().trim().min(1)).default([]),
  errorDigestEmailTime: digestTimeSchema.default("08:00"),
  errorDigestEmailTimezone: timezoneSchema.default("UTC"),
  errorEmailAudience: emailAlertAudienceSchema,
  errorEmailCustomUserIds: z.array(z.string().trim().min(1)),
  errorEmailEnabled: z.boolean(),
  errorEmailRecipient: z.email().trim().toLowerCase().nullable().optional(),
  latencyEmailAudience: emailAlertAudienceSchema,
  latencyEmailCustomUserIds: z.array(z.string().trim().min(1)),
  latencyEmailEnabled: z.boolean(),
  latencyEmailRecipient: z.email().trim().toLowerCase().nullable().optional(),
  latencyErrorThresholdMs: z.number().int().min(1).max(60000)
});

function isValidTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export const acceptProjectInviteSchema = z.object({
  token: z.string().trim().min(24)
});

export type AcceptProjectInviteInput = z.infer<typeof acceptProjectInviteSchema>;
export type CreateProjectInviteInput = z.infer<typeof createProjectInviteSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type ProjectMemberRole = z.infer<typeof projectMemberRoleSchema>;
export type UpdateProjectMemberRoleInput = z.infer<
  typeof updateProjectMemberRoleSchema
>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type UpdateProjectSettingsInput = z.infer<
  typeof updateProjectSettingsSchema
>;
