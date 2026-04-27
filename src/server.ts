import cors from "cors";
import express from "express";
import { z } from "zod";

const ingestSchema = z.object({
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

const app = express();

app.use(cors());
app.use(express.json({ limit: "256kb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/ingest", (req, res) => {
  const apiKey = req.header("x-reqlens-api-key");

  if (!apiKey || apiKey !== process.env.REQLENS_DEV_API_KEY) {
    res.status(401).json({ error: "Invalid API key." });
    return;
  }

  const parsed = ingestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ingest payload." });
    return;
  }

  // Temporary until DB exists. Keeps SDK/demo testable now.
  console.log("[ingest]", parsed.data.logs);
  res.status(202).json({ accepted: parsed.data.logs.length });
});

const port = Number(process.env.PORT ?? 3001);

app.listen(port, () => {
  console.log(`Reqlens API listening on http://localhost:${port}`);
});
