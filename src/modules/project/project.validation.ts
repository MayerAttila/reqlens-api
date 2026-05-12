import { z } from "zod";

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

export const acceptProjectInviteSchema = z.object({
  token: z.string().trim().min(24)
});

export type AcceptProjectInviteInput = z.infer<typeof acceptProjectInviteSchema>;
export type CreateProjectInviteInput = z.infer<typeof createProjectInviteSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
