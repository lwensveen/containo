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
import { apiKeyAuthPlugin } from './plugins/api-key-auth.js';
import buyersRoutes from './modules/buyers/routes.js';
import customsRoutes from './modules/customs/routes.js';
import { fastifyRawBody } from 'fastify-raw-body';
import paymentsRoutes from './modules/payments/routes.js';
import rateLimit from '@fastify/rate-limit';
import pickupsRoutes from './modules/pickups/routes.js';
import inboundRoutes from './modules/inbound/routes.js';
import lanesRoutes from './modules/lanes/routes.js';
import poolsCron from './plugins/pools/cron.js';

export async function buildServer() {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.register(sensible);
  app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['content-type', 'authorization', 'x-admin-token', 'idempotency-key'],
    credentials: true,
  });
  app.register(swaggerPlugin);
  app.register(dateSerializer);
  app.register(apiKeyAuthPlugin);
  app.register(schedulerPlugin);
  app.register(fastifyRawBody, {
    field: 'rawBody',
    global: false,
    encoding: false,
    runFirst: true,
  });
  app.register(rateLimit, { global: false });
  if ((process.env.CRON_POOLS_ENABLED ?? 'true').toLowerCase() === 'true') {
    await app.register(poolsCron);
  }

  app.get('/health', async () => ({ ok: true, service: 'containo-api' }));

  app.register(buyersRoutes, { prefix: '/buyers' });
  app.register(consolidationRoutes, { prefix: '/consolidation' });
  app.register(customsRoutes, { prefix: '/customs' });
  app.register(eventsRoutes, { prefix: '/pool-events' });
  app.register(inboundRoutes, { prefix: '/inbound' });
  app.register(paymentsRoutes, { prefix: '/payments' });
  app.register(pickupsRoutes, { prefix: '/pickups' });
  app.register(poolsRoutes, { prefix: '/pools' });
  app.register(sellerBatchRoutes, { prefix: '/seller-batches' });
  app.register(warehousePickupRoutes, { prefix: '/warehouse-pickups' });
  app.register(webhooksRoutes, { prefix: '/webhooks' });
  app.register(lanesRoutes, { prefix: '/lanes' });

  return app;
}
