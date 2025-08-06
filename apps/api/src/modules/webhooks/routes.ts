import type { FastifyInstance } from 'fastify';
import { z } from 'zod/v4';
import {
  WebhookCreateSchema,
  WebhookIdParamSchema,
  WebhookListResponse,
  WebhookRecordSchema,
} from '@containo/types';
import { listWebhooks } from './services/list-webhooks.js';
import { createWebhook } from './services/create-webhook.js';
import { deactivateWebhook } from './services/deactivate-webhook.js';

export function webhooksRoutes(app: FastifyInstance) {
  app.get<{ Reply: z.infer<typeof WebhookListResponse> }>(
    '/',
    { schema: { response: { 200: WebhookListResponse } } },
    async (req, reply) => {
      return reply.send(await listWebhooks());
    }
  );

  app.post<{
    Body: z.infer<typeof WebhookCreateSchema>;
    Reply: z.infer<typeof WebhookRecordSchema>;
  }>(
    '/',
    {
      schema: {
        body: WebhookCreateSchema,
        response: { 201: WebhookRecordSchema },
      },
    },
    async (req, reply) => {
      const row = await createWebhook(req.body);
      return reply.code(201).send(row);
    }
  );

  app.delete<{
    Params: z.infer<typeof WebhookIdParamSchema>;
    Reply: z.infer<typeof WebhookRecordSchema>;
  }>(
    '/:id',
    {
      schema: {
        params: WebhookIdParamSchema,
        response: { 200: WebhookRecordSchema },
      },
    },
    async (req, reply) => {
      const row = await deactivateWebhook(req.params.id);
      if (!row) return reply.notFound('Webhook not found');
      return reply.send(row);
    }
  );
}

export default webhooksRoutes;
