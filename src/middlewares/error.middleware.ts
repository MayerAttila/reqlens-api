import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";

export function errorMiddleware(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  console.error("[api:error]", error);
  res.status(500).json({ error: "Internal server error." });
}
