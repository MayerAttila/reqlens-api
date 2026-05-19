import { Response } from "express";

export type SdkConfigPayload = {
  capture: {
    slowRequestThresholdMs: number;
  };
};

const clientsByProjectId = new Map<string, Set<Response>>();

export function addProjectSdkConfigClient(
  projectId: string,
  response: Response,
  config: SdkConfigPayload
) {
  response.writeHead(200, {
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
    "content-type": "text/event-stream",
    "x-accel-buffering": "no"
  });
  response.write(": connected\n\n");
  writeEvent(response, "config", config);

  const clients = clientsByProjectId.get(projectId) ?? new Set<Response>();
  clients.add(response);
  clientsByProjectId.set(projectId, clients);

  response.on("close", () => {
    clients.delete(response);

    if (clients.size === 0) {
      clientsByProjectId.delete(projectId);
    }
  });
}

export function publishProjectSdkConfig(
  projectId: string,
  config: SdkConfigPayload
) {
  const clients = clientsByProjectId.get(projectId);

  if (!clients) {
    return;
  }

  for (const client of clients) {
    writeEvent(client, "config", config);
  }
}

function writeEvent(response: Response, event: string, data: unknown) {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
}
