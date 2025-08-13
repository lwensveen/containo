import Fastify from 'fastify';
import cors from '@fastify/cors';
import eventsRoutes from './modules/events/routes.js';
import schedulerPlugin from './plugins/scheduler.js';
import sensible from '@fastify/sensible';
import swaggerPlugin from './plugins/swagger.js';
import webhooksRoutes from './modules/webhooks/routes.js';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import { poolsRoutes } from './modules/pools/routes.js';
import dateSerializer from './plugins/date-serializer.js';
import sellerBatchRoutes from './modules/seller-batch/routes.js';
import warehousePickupRoutes from './modules/warehouse-pickup/routes.js';
import consolidationRoutes from './modules/consolidation/routes.js';
import { webhookDeliveryWorker } from './plugins/webhook-delivery-worker.js';

export async function buildServer() {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.register(sensible);
  app.register(cors, { origin: true });
  app.register(swaggerPlugin);
  app.register(dateSerializer);

  app.get('/health', async () => ({ ok: true, service: 'containo-api' }));

  app.register(webhookDeliveryWorker);

  app.register(consolidationRoutes, { prefix: '/consolidation' });
  app.register(eventsRoutes, { prefix: '/pool-events' });
  app.register(poolsRoutes, { prefix: '/pools' });
  app.register(sellerBatchRoutes, { prefix: '/seller-batches' });
  app.register(warehousePickupRoutes, { prefix: '/warehouse-pickups' });
  app.register(webhooksRoutes, { prefix: '/webhooks' });

  app.register(schedulerPlugin);

  return app;
}
