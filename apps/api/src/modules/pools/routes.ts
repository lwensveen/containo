import type { FastifyInstance } from "fastify";
import { listPools, submitIntent } from "./services";
import { quotePrice } from "./utils";

export async function poolsRoutes(app: FastifyInstance) {
  app.get("/", async () => listPools());

  app.post<{
    Body: {
      mode: "sea" | "air";
      weightKg: number;
      dimsCm: { length: number; width: number; height: number };
    };
  }>("/quote", async (req) => {
    return quotePrice(req.body);
  });

  app.post<{
    Body: {
      userId: string;
      originPort: string;
      destPort: string;
      mode: "sea" | "air";
      cutoffISO: string;
      weightKg: number;
      dimsCm: { length: number; width: number; height: number };
    };
  }>("/intent", async (req, reply) => {
    const { id, volumeM3 } = await submitIntent(req.body);
    return reply.code(202).send({ id, accepted: true, volumeM3 });
  });
}
