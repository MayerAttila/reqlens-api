import { z } from "zod";

export const projectMemberRoleSchema = z.enum(["admin", "developer", "viewer"]);

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
  latencyErrorThresholdMs: z.number().int().min(1).max(60000)
});

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
