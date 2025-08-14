import type { FastifyInstance } from 'fastify';
import { z } from 'zod/v4';
import {
  DeliveriesListQuerySchema,
  DeliveryIdParamSchema,
  WebhookCreateSchema,
  WebhookDeliveryPublicSchema,
  WebhookDeliveryWithSubSchema,
  WebhookIdParamSchema,
  WebhookListResponse,
  WebhookRecordSchema,
} from '@containo/types';
import { listWebhooks } from './services/list-webhooks.js';
import { createWebhook } from './services/create-webhook.js';
import { deactivateWebhook } from './services/deactivate-webhook.js';
import { listDeliveries } from './services/list-deliveries.js';
import { retryDelivery } from './services/retry-delivery.js';

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

  app.get<{
    Querystring: z.infer<typeof DeliveriesListQuerySchema>;
    Reply: z.infer<(typeof WebhookDeliveryWithSubSchema)[]>;
  }>(
    '/deliveries',
    {
      schema: {
        querystring: DeliveriesListQuerySchema,
        response: { 200: z.array(WebhookDeliveryWithSubSchema) },
      },
    },
    async (req) => {
      return listDeliveries({ status: req.query.status, limit: req.query.limit });
    }
  );

  app.post<{
    Params: z.infer<typeof DeliveryIdParamSchema>;
    Reply: z.infer<typeof WebhookDeliveryPublicSchema>;
  }>(
    '/deliveries/:id/retry',
    {
      schema: {
        params: DeliveryIdParamSchema,
        response: { 200: WebhookDeliveryPublicSchema },
      },
    },
    async (req, reply) => {
      const row = await retryDelivery(req.params.id);
      if (!row) return reply.notFound('Delivery not found');
      return row as any;
    }
  );
}

export default webhooksRoutes;
