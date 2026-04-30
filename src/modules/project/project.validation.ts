import { z } from "zod";

export const createProjectSchema = z.object({
  description: z.string().trim().max(240).optional(),
  name: z.string().trim().min(2).max(80)
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
