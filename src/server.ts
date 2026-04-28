import cors from "cors";
import express from "express";
import "./env.js";
import { toNodeHandler } from "better-auth/node";
import { createHash } from "node:crypto";
import { z } from "zod";
import { auth } from "./auth.js";
import { prisma } from "./db.js";

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

app.use(
  cors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
    credentials: true
  })
);
app.all("/api/auth/*", toNodeHandler(auth));
app.use(express.json({ limit: "256kb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/ingest", async (req, res) => {
  const apiKey = req.header("x-reqlens-api-key");

  if (!apiKey) {
    res.status(401).json({ error: "Invalid API key." });
    return;
  }

  const parsed = ingestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ingest payload." });
    return;
  }

  try {
    const projectId = await getProjectIdForApiKey(apiKey);

    if (!projectId) {
      res.status(401).json({ error: "Invalid API key." });
      return;
    }

    await prisma.requestLog.createMany({
      data: parsed.data.logs.map((log) => ({
        projectId,
        method: log.method,
        path: log.path,
        statusCode: log.statusCode,
        durationMs: log.durationMs,
        createdAt: new Date(log.timestamp)
      }))
    });

    console.log("[ingest]", {
      projectId,
      accepted: parsed.data.logs.length
    });

    res.status(202).json({ accepted: parsed.data.logs.length });
  } catch (error) {
    console.error("[ingest:error]", error);
    res.status(500).json({ error: "Failed to store ingest logs." });
  }
});

const port = Number(process.env.PORT ?? 3001);

app.listen(port, () => {
  console.log(`Reqlens API listening on http://localhost:${port}`);
});

async function getProjectIdForApiKey(apiKey: string): Promise<string | null> {
  const keyHash = hashApiKey(apiKey);
  const existingApiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: { projectId: true }
  });

  if (existingApiKey) {
    return existingApiKey.projectId;
  }

  if (
    process.env.REQLENS_AUTO_CREATE_DEV_PROJECT === "false" ||
    apiKey !== process.env.REQLENS_DEV_API_KEY
  ) {
    return null;
  }

  const user = await prisma.user.upsert({
    where: { email: "dev@reqlens.local" },
    update: {},
    create: {
      id: "dev_user",
      name: "Dev User",
      email: "dev@reqlens.local",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  const project = await prisma.project.upsert({
    where: { id: "dev_project" },
    update: {},
    create: {
      id: "dev_project",
      userId: user.id,
      name: "Dev Project"
    }
  });

  await prisma.apiKey.upsert({
    where: { keyHash },
    update: { projectId: project.id },
    create: {
      projectId: project.id,
      keyHash
    }
  });

  return project.id;
}

function hashApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex");
}
