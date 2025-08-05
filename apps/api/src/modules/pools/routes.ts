import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { quotePrice } from './utils.js';
import {
  IntentInputSchema,
  IntentResponseSchema,
  PoolIdParamSchema,
  PoolItemsResponseSchema,
  PoolSchema,
  PoolStatusUpdateSchema,
  QuoteInputSchema,
  QuoteSchema,
} from './schemas.js';
import { listPools } from './services/list-pools.js';
import { submitIntent } from './services/submit-intent.js';
import { getPoolById } from './services/get-pool-by-id.js';
import { listItemsByPool } from './services/list-items-by-pool.js';
import { itemsToCsv } from './services/items-to-csv.js';
import { updatePoolStatus } from './services/update-pool-status.js';

export function poolsRoutes(app: FastifyInstance) {
  app.get('/', { schema: { response: { 200: z.array(PoolSchema) } } }, async () => listPools());

  app.post<{
    Body: z.infer<typeof QuoteInputSchema>;
    Reply: z.infer<typeof QuoteSchema>;
  }>(
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

  app.post<{
    Body: z.infer<typeof IntentInputSchema>;
    Reply: z.infer<typeof IntentResponseSchema>;
  }>(
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

  app.get<{
    Params: z.infer<typeof PoolIdParamSchema>;
    Reply: z.infer<typeof PoolItemsResponseSchema>;
  }>(
    '/:id/items',
    {
      schema: {
        params: PoolIdParamSchema,
        response: { 200: PoolItemsResponseSchema },
      },
    },
    async (req, reply) => {
      const pool = await getPoolById(req.params.id);
      if (!pool) return reply.notFound('Pool not found');
      return listItemsByPool(req.params.id);
    }
  );

  app.get<{
    Params: z.infer<typeof PoolIdParamSchema>;
  }>('/:id/items.csv', { schema: { params: PoolIdParamSchema } }, async (req, reply) => {
    const pool = await getPoolById(req.params.id);
    if (!pool) return reply.notFound('Pool not found');
    const rows = await listItemsByPool(req.params.id);
    const csv = itemsToCsv(rows);
    reply.header('content-type', 'text/csv; charset=utf-8');
    reply.header('content-disposition', `attachment; filename="pool_${req.params.id}_items.csv"`);
    return reply.send(csv);
  });

  app.post<{
    Params: z.infer<typeof PoolIdParamSchema>;
    Body: z.infer<typeof PoolStatusUpdateSchema>;
    Reply: z.infer<typeof PoolSchema>;
  }>(
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
