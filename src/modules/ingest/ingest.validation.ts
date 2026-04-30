import { z } from "zod";

export const ingestSchema = z.object({
  logs: z
    .array(
      z.object({
        method: z.string().min(1),
        path: z.string().min(1),
        statusCode: z.number().int().min(100).max(599),
        durationMs: z.number().int().min(0),
        timestamp: z.string().datetime()
      })
    )
    .min(1)
    .max(100)
});

export type IngestInput = z.infer<typeof ingestSchema>;
