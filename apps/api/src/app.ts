import Fastify from "fastify";
import sensible from "@fastify/sensible";
import cors from "@fastify/cors";
import { poolsRoutes } from "./modules/pools/routes";
import { startScheduler } from "./lib/scheduler";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(sensible);
  app.register(cors, { origin: true });

  app.get("/health", async () => ({ ok: true, service: "containo-api" }));

  app.register(poolsRoutes, { prefix: "/pools" });

  startScheduler(app);

  return app;
}
