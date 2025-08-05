import "dotenv/config";
import { buildApp } from "./app";
import { ENV } from "./env";

const app = buildApp();

app.listen({ port: ENV.PORT, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
