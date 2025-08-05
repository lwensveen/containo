import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import cors from '@fastify/cors';
import { poolsRoutes } from './modules/pools/routes';
import { startScheduler } from './lib/scheduler';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export function buildApp() {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

  app.register(sensible);
  app.register(cors, { origin: true });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.get('/health', async () => ({ ok: true, service: 'containo-api' }));

  app.register(poolsRoutes, { prefix: '/pools' });

  app.register(swagger, {
    openapi: {
      info: { title: 'Containo API', version: '0.1.0' },
    },
    transform: jsonSchemaTransform,
  });
  app.register(swaggerUi, { routePrefix: '/docs' });

  startScheduler(app);

  return app;
}
