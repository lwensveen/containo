import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod/v4';
import { bookContainer } from '../../jobs/book-container.js';

const bookBodySchema = z.object({ poolId: z.uuid() });

const consolidationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: z.infer<typeof bookBodySchema>;
  }>(
    '/book',
    {
      schema: {
        body: bookBodySchema,
        response: { 202: z.object({ status: z.literal('queued') }) },
      },
    },
    async (request, reply) => {
      const { poolId } = request.body;
      bookContainer(poolId).catch((err) => fastify.log.error(err));
      return reply.code(202).send({ status: 'queued' });
    }
  );
};

export default consolidationRoutes;
