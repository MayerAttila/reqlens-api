import { Router } from "express";
import { healthRouter } from "../modules/health/health.route.js";
import { ingestRouter } from "../modules/ingest/ingest.route.js";
import { projectRouter } from "../modules/project/project.route.js";

export const routes = Router();

routes.use("/health", healthRouter);
routes.use("/ingest", ingestRouter);
routes.use("/projects", projectRouter);
