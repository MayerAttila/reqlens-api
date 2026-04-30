import { NextFunction, Request, Response } from "express";

export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startedAt = performance.now();

  res.on("finish", () => {
    const durationMs = Math.round(performance.now() - startedAt);
    const status = res.statusCode;
    const level = status >= 500 ? "error" : status >= 400 ? "warn" : "ok";
    const color = getStatusColor(status);
    const reset = "\x1b[0m";

    console.log(
      `${color}[api:${level}] ${req.method} ${req.originalUrl} ${status} ${durationMs}ms${reset}`
    );
  });

  next();
}

function getStatusColor(status: number): string {
  if (status >= 500) {
    return "\x1b[31m";
  }

  if (status >= 400) {
    return "\x1b[33m";
  }

  return "\x1b[32m";
}
