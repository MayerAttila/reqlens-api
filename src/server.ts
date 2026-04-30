import { app } from "./app.js";
import { env } from "./config/index.js";

app.listen(env.port, () => {
  console.log(`Reqlens API listening on http://localhost:${env.port}`);
});
