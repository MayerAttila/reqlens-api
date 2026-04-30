import cors from "cors";
import express from "express";
import { env } from "./config/index.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { registerAuthRoutes } from "./modules/auth/auth.route.js";
import { routes } from "./routes/index.js";

export const app = express();

app.use(
  cors({
    origin: env.webOrigin,
    credentials: true
  })
);

registerAuthRoutes(app);
app.use(express.json({ limit: "256kb" }));
app.use(routes);
app.use(errorMiddleware);
