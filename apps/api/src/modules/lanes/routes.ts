import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  createPool,
  createPoolInput,
  getNextOpenPool,
  listPools,
  updatePool,
  updatePoolInput,
} from './services.js';

export default async function lanesRoutes(app: FastifyInstance) {
  app.get('/lanes/next', {
    schema: {
      querystring: z
        .object({
          originPort: z.string().length(3),
          destPort: z.string().length(3),
          mode: z.enum(['air', 'sea']),
        })
        .strict() as any,
    },
    handler: async (req, reply) => {
      const { originPort, destPort, mode } = req.query as {
        originPort: string;
        destPort: string;
        mode: 'air' | 'sea';
      };
      const next = await getNextOpenPool({ originPort, destPort, mode });
      if (!next) return reply.code(404).send({ error: 'no_open_pool' });
      reply.send(next);
    },
  });

  app.post('/lanes/pools', {
    schema: { body: createPoolInput as any },
    // you can add auth preHandler later
    handler: async (req, reply) => {
      const { id, duplicate } = await createPool(req.body as any);
      reply.send({ id, duplicate });
    },
  });

  app.get('/lanes/pools', {
    schema: {
      querystring: z
        .object({
          originPort: z.string().length(3).optional(),
          destPort: z.string().length(3).optional(),
          mode: z.enum(['air', 'sea']).optional(),
          status: z.string().optional() /* comma list, e.g. "open,closing" */,
          limit: z.coerce.number().min(1).max(200).optional(),
        })
        .strict() as any,
    },
    handler: async (req, reply) => {
      const q = req.query as {
        originPort?: string;
        destPort?: string;
        mode?: 'air' | 'sea';
        status?: string;
        limit?: number;
      };

      const rows = await listPools({
        originPort: q.originPort,
        destPort: q.destPort,
        mode: q.mode,
        status: q.status ? (q.status.split(',') as any) : undefined,
        limit: q.limit,
      });
      reply.send(rows);
    },
  });

  app.patch('/lanes/pools/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }).strict() as any,
      body: updatePoolInput as any,
    },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const row = await updatePool(id, req.body as any);
      if (!row) return reply.code(404).send({ error: 'not_found' });
      reply.send(row);
    },
  });
}
