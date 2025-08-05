import type { FastifyInstance } from 'fastify';
import { listPools, submitIntent } from './services';
import { quotePrice } from './utils';
import { IntentInputSchema, IntentResponseSchema, QuoteInputSchema, QuoteSchema } from './schemas';

export async function poolsRoutes(app: FastifyInstance) {
  app.get('/', async () => listPools());

  app.post(
    '/quote',
    {
      schema: {
        body: QuoteInputSchema,
        response: { 200: QuoteSchema },
      },
    },
    async (req) => {
      return quotePrice(req.body);
    }
  );

  app.post(
    '/intent',
    {
      schema: {
        body: IntentInputSchema,
        response: { 202: IntentResponseSchema },
      },
    },
    async (req, reply) => {
      const { id, volumeM3 } = await submitIntent(req.body);
      return reply.code(202).send({ id, accepted: true as const, volumeM3 });
    }
  );
}
