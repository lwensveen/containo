import { FastifyInstance } from 'fastify';
import {
  WebhookCreateSchema,
  WebhookIdParamSchema,
  WebhookListResponse,
  WebhookRecordSchema,
} from './schemas';
import { createWebhook, deactivateWebhook, listWebhooks } from './services';

export function webhooksRoutes(app: FastifyInstance) {
  app.get('/', { schema: { response: { 200: WebhookListResponse } } }, async () => {
    return listWebhooks();
  });

  app.post(
    '/',
    { schema: { body: WebhookCreateSchema, response: { 201: WebhookRecordSchema } } },
    async (req, reply) => {
      const row = await createWebhook(req.body);
      return reply.code(201).send(row);
    }
  );

  app.delete(
    '/:id',
    { schema: { params: WebhookIdParamSchema, response: { 200: WebhookRecordSchema } } },
    async (req, reply) => {
      const row = await deactivateWebhook(req.params.id);
      if (!row) return reply.notFound('Webhook not found');
      return row;
    }
  );
}

export default webhooksRoutes;
