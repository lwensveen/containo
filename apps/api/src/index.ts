import "dotenv/config";
import Fastify from "fastify";
import sensible from "@fastify/sensible";
import cors from "@fastify/cors";

const app = Fastify({ logger: true });
await app.register(sensible);
await app.register(cors, { origin: true });

app.get("/health", async () => ({ ok: true, service: "containo-api" }));

app.get("/pools", async () => []);

app.post("/pools/intent", async (req, reply) => {
  reply.code(202).send({ received: true });
});

const port = Number(process.env.PORT ?? 4000);
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
