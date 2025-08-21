import type { FastifyInstance } from 'fastify';
import { z } from 'zod/v4';
import { fingerprint, quotePrice } from './utils.js';
import {
  IntentInputSchema,
  IntentResponseSchema,
  PoolIdParamSchema,
  PoolItemsResponseSchema,
  PoolSelectSchema,
  PoolStatusUpdateSchema,
  QuoteInputSchema,
  QuoteSchema,
} from '@containo/types';
import { listPools } from './services/list-pools.js';
import { submitIntent } from './services/submit-intent.js';
import { getPoolById } from './services/get-pool-by-id.js';
import { listItemsByPool } from './services/list-items-by-pool.js';
import { itemsToCsv } from './services/items-to-csv.js';
import { updatePoolStatus } from './services/update-pool-status.js';
import { db, poolsTable } from '@containo/db';
import { eq } from 'drizzle-orm';
import { withIdempotency } from '../../lib/idempotency.js';

export function poolsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    { schema: { response: { 200: z.array(PoolSelectSchema) } } },
    async (_req, reply) => {
      const rows = await listPools();
      return reply.type('application/json').send(rows ?? []);
    }
  );

  app.post<{
    Body: z.infer<typeof QuoteInputSchema>;
    Reply: z.infer<typeof QuoteSchema>;
  }>(
    '/quote',
    {
      preHandler: app.requireApiKey(['quote:write']),
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
      preHandler: app.requireApiKey(['intent:write']),
      schema: {
        body: IntentInputSchema,
        response: { 202: IntentResponseSchema },
      },
    },
    async (req, reply) => {
      const headerKey =
        (req.headers['idempotency-key'] as string | undefined) ||
        (req.headers['x-idempotency-key'] as string | undefined);
      const key = headerKey ?? fingerprint(req.body);

      const payloadForCache = {
        userId: req.body.userId,
        originPort: req.body.originPort,
        destPort: req.body.destPort,
        mode: req.body.mode,
        cutoffAt: req.body.cutoffAt,
        weightKg: req.body.weightKg,
        dimsCm: req.body.dimsCm,
      };

      const run = async () => submitIntent(req.body); // submitIntent no longer cares about idempotency

      const { id, volumeM3 } = await withIdempotency('pools.intent', key, payloadForCache, run);

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
    Reply: z.infer<typeof PoolSelectSchema>;
  }>(
    '/:id/status',
    {
      schema: {
        params: PoolIdParamSchema,
        body: PoolStatusUpdateSchema,
        response: { 200: PoolSelectSchema },
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

  app.get('/pools/:id/public', {
    schema: { params: z.object({ id: z.string().uuid() }) as any },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };

      const [p] = await db.select().from(poolsTable).where(eq(poolsTable.id, id)).limit(1);
      if (!p) return reply.notFound();

      const cap = Number(p.capacityM3 ?? 0);
      const used = Number(p.usedM3 ?? 0);
      const cutoffMs = new Date(String(p.cutoffAt)).getTime();
      const secondsToCutoff = Math.max(0, Math.floor((cutoffMs - Date.now()) / 1000));
      const fillPercent = cap > 0 ? Math.max(0, Math.min(1, used / cap)) : 0;

      reply.send({
        id: p.id,
        originPort: p.originPort,
        destPort: p.destPort,
        mode: p.mode,
        cutoffAt: p.cutoffAt,
        status: p.status,
        capacityM3: String(p.capacityM3 ?? '0'),
        usedM3: String(p.usedM3 ?? '0'),
        fillPercent,
        secondsToCutoff,
      });
    },
  });
}

export default poolsRoutes;
