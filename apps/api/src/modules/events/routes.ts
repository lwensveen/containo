import type { FastifyInstance } from 'fastify';
import { EventRecentQuerySchema, EventRecentResponseSchema } from '@containo/types';
import { recentEvents } from './services/recent-events.js';
import { z } from 'zod/v4';

export function eventsRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: z.infer<typeof EventRecentQuerySchema>;
  }>(
    '/recent',
    {
      schema: {
        querystring: EventRecentQuerySchema,
        response: { 200: EventRecentResponseSchema },
      },
    },
    async (req) => {
      const { limit } = req.query;
      return recentEvents(limit ?? 50);
    }
  );
}

export default eventsRoutes;
