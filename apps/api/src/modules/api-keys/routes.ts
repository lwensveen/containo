import type { FastifyInstance } from 'fastify';
import { z } from 'zod/v4';
import {
  ApiKeyCreateResponseSchema,
  ApiKeyCreateSchema,
  ApiKeyRecordSchema,
} from '@containo/types';
import { createApiKey } from './services/create-api-key.js';
import { listApiKeys } from './services/list-api-keys.js';
import { revokeApiKey } from './services/revoke-api-key.js';
import { requireAdmin } from './utils.js';

export function apiKeysRoutes(app: FastifyInstance) {
  app.post<{
    Body: z.infer<typeof ApiKeyCreateSchema>;
    Reply: z.infer<typeof ApiKeyCreateResponseSchema>;
  }>(
    '/',
    {
      preHandler: requireAdmin,
      schema: {
        body: ApiKeyCreateSchema,
        response: { 201: ApiKeyCreateResponseSchema },
      },
    },
    async (req, reply) => {
      const res = await createApiKey(req.body);

      return reply.code(201).send(res);
    }
  );

  app.get<{ Reply: z.infer<typeof ApiKeyRecordSchema>[] }>(
    '/',
    { schema: { response: { 200: ApiKeyRecordSchema.array() } } },
    async () => {
      return listApiKeys();
    }
  );

  app.post<{ Params: { id: string }; Reply: z.infer<typeof ApiKeyRecordSchema> }>(
    '/:id/revoke',
    {
      preHandler: requireAdmin,
      schema: {
        params: z.object({ id: z.string().uuid() }),
        response: { 200: ApiKeyRecordSchema },
      },
    },
    async (req, reply) => {
      const row = await revokeApiKey(req.params.id);

      if (!row) return reply.notFound('Not found');

      return row;
    }
  );
}

export default apiKeysRoutes;
