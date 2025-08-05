import type { FastifyInstance } from 'fastify';
import {
  getPoolById,
  itemsToCsv,
  listItemsByPool,
  listPools,
  submitIntent,
  updatePoolStatus,
} from './services';
import { quotePrice } from './utils';
import {
  IntentInputSchema,
  IntentResponseSchema,
  PoolIdParamSchema,
  PoolItemsResponseSchema,
  PoolSchema,
  PoolStatusUpdateSchema,
  QuoteInputSchema,
  QuoteSchema,
} from './schemas';

export function poolsRoutes(app: FastifyInstance) {
  app.get('/', async () => listPools());

  app.post(
    '/quote',
    { schema: { body: QuoteInputSchema, response: { 200: QuoteSchema } } },
    async (req) => quotePrice(req.body)
  );

  app.post(
    '/intent',
    { schema: { body: IntentInputSchema, response: { 202: IntentResponseSchema } } },
    async (req, reply) => {
      const { id, volumeM3 } = await submitIntent(req.body);
      return reply.code(202).send({ id, accepted: true as const, volumeM3 });
    }
  );

  app.get(
    '/:id/items',
    { schema: { params: PoolIdParamSchema, response: { 200: PoolItemsResponseSchema } } },
    async (req, reply) => {
      const pool = await getPoolById(req.params.id);
      if (!pool) return reply.notFound('Pool not found');
      return listItemsByPool(req.params.id);
    }
  );

  app.get('/:id/items.csv', { schema: { params: PoolIdParamSchema } }, async (req, reply) => {
    const pool = await getPoolById(req.params.id);
    if (!pool) return reply.notFound('Pool not found');
    const rows = await listItemsByPool(req.params.id);
    const csv = itemsToCsv(rows);
    reply.header('content-type', 'text/csv; charset=utf-8');
    reply.header('content-disposition', `attachment; filename="pool_${req.params.id}_items.csv"`);
    return reply.send(csv);
  });

  app.post(
    '/:id/status',
    {
      schema: {
        params: PoolIdParamSchema,
        body: PoolStatusUpdateSchema,
        response: { 200: PoolSchema },
      },
    },
    async (req, reply) => {
      const pool = await getPoolById(req.params.id);
      if (!pool) return reply.notFound('Pool not found');
      const updated = await updatePoolStatus(req.params.id, req.body.status);
      if (!updated) return reply.internalServerError('Failed to update pool status');
      return updated;
    }
  );
}

export default poolsRoutes;
