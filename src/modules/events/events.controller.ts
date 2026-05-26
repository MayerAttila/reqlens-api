import { Request, Response } from "express";
import { getAccessibleProjectIds } from "../project/project.service.js";
import {
  RequestLogCreatedEvent,
  subscribeToDashboardEvent
} from "./event-bus.js";

const heartbeatMs = 25_000;

export async function streamDashboardEventsController(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.authSession!.user.id;
  const accessibleProjectIds = new Set(await getAccessibleProjectIds(userId));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  writeEvent(res, "connected", { ok: true });

  const unsubscribe = subscribeToDashboardEvent(
    "request-log.created",
    (event) => {
      if (!accessibleProjectIds.has(event.projectId)) {
        return;
      }

      writeEvent(res, "request-log.created", event);
    }
  );

  const heartbeat = setInterval(() => {
    res.write(": keep-alive\n\n");
  }, heartbeatMs);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
}

function writeEvent(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}
