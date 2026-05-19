import { Router } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import {
  getSdkConfigController,
  getSdkConfigStreamController
} from "./sdk.controller.js";

export const sdkRouter = Router();

sdkRouter.get("/config", catchAsync(getSdkConfigController));
sdkRouter.get("/config/stream", catchAsync(getSdkConfigStreamController));
