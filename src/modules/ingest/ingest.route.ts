import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { ingestController } from "./ingest.controller.js";
import { ingestSchema } from "./ingest.validation.js";

export const ingestRouter = Router();

ingestRouter.post("/", validateBody(ingestSchema), catchAsync(ingestController));
