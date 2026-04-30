import { toNodeHandler } from "better-auth/node";
import { Express } from "express";
import { auth } from "./auth.service.js";

export function registerAuthRoutes(app: Express): void {
  app.all("/api/auth/*", toNodeHandler(auth));
}
