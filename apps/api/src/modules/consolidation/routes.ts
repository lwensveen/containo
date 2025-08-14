import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod/v4';
import { bookContainer } from './jobs/book-container.js';
import { manualBook } from './services/manual-book.js';

const bookBodySchema = z.object({ poolId: z.uuid() });
const ManualBookBody = z.object({ poolId: z.string().uuid(), bookingRef: z.string().min(3) });

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

  fastify.post<{
    Body: z.infer<typeof ManualBookBody>;
    Reply: { ok: true };
  }>(
    '/manual-book',
    {
      schema: {
        body: ManualBookBody,
        response: { 200: z.object({ ok: z.literal(true) }) },
      },
    },
    async (req, reply) => {
      const ok = await manualBook(req.body.poolId, req.body.bookingRef);
      if (!ok) return reply.notFound('Pool not found or not in a bookable state');
      return { ok: true };
    }
  );
};

export default consolidationRoutes;
