import { app } from "./app.js";
import { env } from "./config/index.js";
import { startErrorDigestScheduler } from "./modules/alerts/error-digest.service.js";

app.listen(env.port, () => {
  console.log(`Reqlens API listening on http://localhost:${env.port}`);
  startErrorDigestScheduler();
});
