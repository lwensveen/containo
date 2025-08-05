import Fastify from 'fastify';
import cors from '@fastify/cors';
import eventsRoutes from './modules/events/routes.js';
import schedulerPlugin from './plugins/scheduler.js';
import sensible from '@fastify/sensible';
import swaggerPlugin from './plugins/swagger.js';
import webhooksRoutes from './modules/webhooks/routes.js';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { poolsRoutes } from './modules/pools/routes.js';
import dateSerializer from './plugins/date-serializer.js';

export async function buildServer() {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

  app.register(sensible);
  app.register(cors, { origin: true });
  app.register(swaggerPlugin);
  app.register(dateSerializer);

  app.get('/health', async () => ({ ok: true, service: 'containo-api' }));

  app.register(eventsRoutes, { prefix: '/events' });
  app.register(poolsRoutes, { prefix: '/pools' });
  app.register(webhooksRoutes, { prefix: '/webhooks' });
  app.register(schedulerPlugin);

  return app;
}
